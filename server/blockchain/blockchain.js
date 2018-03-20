const db = require('../data/db')
const block = require('./block')
const github = require('../data/github')
const crypto = require('./crypto')
const utils = require('../data/utils')

// block difficulty increases by this step every time someone finds and submits a valid nonce
exports.blockDifficultyIncrementStep = 1

// a file with this name at the root of the git repo
const genesisBlockPath = 'genesisblock'

/**
 * Inserts genesis block into git repo if it is not already there, asynchronously.
 */
exports.init = async () => {
  try {
    await github.getFileContent(genesisBlockPath)
  } catch (e) {
    if (e.code !== 404) throw e
    const genesis = block.getGenesisBlock()
    block.sign(genesis)
    await github.upsertFile(block.toJson(genesis), genesisBlockPath)
    console.log(`inserted genesis block to file: ${genesisBlockPath}`)
  }
}

/**
 * Retrieves the full path of a block in a git repo with respect to given time and day shift.
 * @param time - 'Date' object instance.
 * @param dayShift - No of days to shift the time, if any. i.e. +5, -3, etc.
 */
exports.getBlockPath = (time, dayShift) => {
  time = new Date(time.getTime()) // don't modify original
  if (dayShift) {
    time.setDate(time.getDate() + dayShift)
  }
  return `${time.getFullYear()}/${time.getMonth() + 1}/${time.getDate()}`
}

/**
 * Provides a time range for a block:
 * Start: Midnight of {start}.
 * End: Midnight of {end}.
 */
exports.getBlockTimeRange = (start, end) => {
  // make copies of date object not to modify originals
  start = new Date(start.getTime())
  start.setUTCHours(0, 0, 0, 0)

  end = new Date(end.getTime())
  end.setUTCHours(0, 0, 0, 0)

  return {start, end}
}

/**
 * Creates and inserts a new block into the blockchain git repo, asynchronously.
 * @param startTime - Time to start including txs from.
 * @param endTime - Time to stop including txs from.
 * @param blockPath - Full path of the block to create. i.e. "dir/sub_dir/filename".
 * @param prevBlockHeader - Previous block's header.
 */
exports.insertBlock = async (startTime, endTime, blockPath, prevBlockHeader) => {
  const txs = await db.getTxsByTimeRange(startTime, endTime)
  const newBlock = block.create(txs, prevBlockHeader)
  block.sign(newBlock)
  block.verify(newBlock, prevBlockHeader)
  await github.createFile(block.toJson(newBlock), blockPath)
  console.log(`inserted block ${blockPath}`)
}

/**
 * Looks for the latest block then creates a new block with matching txs (if any), asynchronously.
 * Start time will be the very beginning of the day that the last block was created.
 * End date will be the very beginning of {now}.
 * @param now - Required just in case day changes right before the call to this function (so not using new Date()).
 * @param blockPath - Full path of the block to create. i.e. "dir/sub_dir/filename".
 * @param lastBlockHeader - Only used for testing. Automatically retrieved from GitHub otherwise.
 */
exports.insertBlockSinceLastOne = async (now, blockPath, lastBlockHeader) => {
  lastBlockHeader = lastBlockHeader || await exports.getLastBlockHeader()
  const blockTimeRange = exports.getBlockTimeRange(lastBlockHeader.time, now)
  await exports.insertBlock(blockTimeRange.start, blockTimeRange.end, blockPath, lastBlockHeader)
}

/**
 * Checks if it is time then creates the required block in blockchain, asynchronously.
 * Returns true if a block was inserted. False otherwise.
 * @param blockPath - Only used for testing. Automatically calculated otherwise.
 * @param now - Only used for testing. Automatically calculated otherwise.
 */
exports.insertBlockIfRequired = async (blockPath, now) => {
  // check if it is time to create a block
  now = now || new Date()
  now.setMinutes(now.getMinutes() - 15 /* some latency to let ongoing txs to complete */)
  blockPath = blockPath || exports.getBlockPath(now, -1)
  try {
    await github.getFileContent(blockPath)
    console.log('not enough time elapsed since the last block so skipping block creation')
    return false
  } catch (e) {
    if (e.code !== 404) {
      throw e
    }

    await exports.insertBlockSinceLastOne(now, blockPath)
    return true
  }
}

function failSafeInsertBlockIfRequired () {
  exports.insertBlockIfRequired().catch(e => console.error(e))
}

let timerStarted = false
/**
 * Starts the the blockchain insert timer.
 * Returns a number that can be used in clearing the interval with "clearInterval(ret)".
 * @param interval - Only used for testing. Automatically calculated otherwise.
 */
exports.startBlockchainInsertTimer = interval => {
  // prevent duplicate timers
  if (timerStarted) {
    return
  }
  timerStarted = true

  // do initial block check immediately
  // skip on testing since ongoing promise can do conflicting data changes
  !interval && failSafeInsertBlockIfRequired()

  // start timer
  interval = interval || 1000/* ms */ * 60/* s */ * 15/* min */
  return setInterval(() => failSafeInsertBlockIfRequired(), interval)
}

/**
 * Retrieves last last mineable block's header for peers that choose to trust the majorna server, asynchronously.
 * In most cases, one honest peer is enough to get the longest blockchain since it's so hard to fake an entire chain.
 */
exports.getMineableBlockHeader = async () => {
  const header = await exports.getLastBlockHeader()
  const targetDifficulty = header.difficulty = (header.difficulty + exports.blockDifficultyIncrementStep) // always need to work on a greater difficulty than existing
  const str = block.getHeaderStr(header, true)
  // todo: can be simplified greatly, can also include reward in header and reward tx in block
  return {
    no: header.no,
    previousDifficulty: targetDifficulty - exports.blockDifficultyIncrementStep,
    targetDifficulty,
    reward: block.getBlockReward(targetDifficulty),
    headerString: str,
    headerObject: header
  }
}

/**
 * Collects mining reward for a given block number and nonce, asynchronously.
 * Mined block must be the latest, and the nonce must be greater than or equal to the target difficulty.
 */
exports.collectMiningReward = async (blockNo, nonce, uid) => {
  // block must be latest
  const mineableBlockHeader = await exports.getMineableBlockHeader()
  if (blockNo !== mineableBlockHeader.no) {
    throw new utils.UserVisibleError(`Mined block: ${blockNo} is not the latest: ${mineableBlockHeader.no}.`)
  }

  // nonce must be of required difficulty
  const hash = crypto.hashTextToBuffer('' + nonce + mineableBlockHeader.headerString)
  const difficulty = block.getHashDifficulty(hash)
  if (difficulty < mineableBlockHeader.targetDifficulty) {
    throw new utils.UserVisibleError(`Given nonce: ${nonce} (difficulty: ${difficulty}, hash: ${hash.toString('base64')}) is less than the target difficulty: ${mineableBlockHeader.targetDifficulty}.`)
  }

  // update the last block with the new and more difficult nonce
  const lastBlockHeader = mineableBlockHeader.headerObject // this has header.path
  const lastBlockFile = await github.getFileContent(lastBlockHeader.path)
  const lastBlock = block.fromJson(lastBlockFile) // this does not have header.path
  lastBlockHeader.difficulty = lastBlock.header.difficulty = difficulty
  lastBlockHeader.nonce = lastBlock.header.nonce = nonce
  block.sign(lastBlock)
  // todo: these need to be transactional so they fail or succeed at the same time
  // could be github.upsertFile() inside the firestore transaction
  await github.upsertFile(block.toJson(lastBlock), lastBlockHeader.path)
  await github.upsertFile(block.toJson(lastBlockHeader), 'lastblock')

  // give reward to the user
  await db.giveMiningReward(uid, mineableBlockHeader.reward, lastBlock.header)
  return mineableBlockHeader.reward
}
