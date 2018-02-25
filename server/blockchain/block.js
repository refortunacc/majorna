const MerkleTools = require('merkle-tools')
const crypto = require('./crypto')
const tx = require('./tx')

/**
 * The very first block of the blockchain (no = 0).
 * Either trust (signature) or PoW (difficulty and nonce) are required.
 */
exports.genesisBlock = {
  sig: '', // optional: if given, difficulty and nonce are not required
  header: {
    no: 1,
    prevHash: '',
    txCount: 0,
    merkleRoot: '',
    time: new Date('01 Jan 2018 00:00:00 UTC'),
    difficulty: 0, // optional: if sig is not present, should be > 0
    nonce: 0 // optional: if sig is not present, should be > 0
  },
  data: []
}

exports.getHeaderStr = blockHeader =>
  '' + blockHeader.no + blockHeader.prevHash + blockHeader.txCount + blockHeader.merkleRoot + blockHeader.time.getTime() + blockHeader.difficulty + blockHeader.nonce

exports.sign = block => {
  const sigBlock = {
    header: {
      no: block.header.no,
      prevHash: block.header.prevHash,
      txCount: block.header.txCount,
      merkleRoot: block.header.merkleRoot,
      time: block.header.time,
      difficulty: block.header.difficulty,
      nonce: block.header.nonce
    },
    data: block.data.map(t => tx.getObj(t))
  }
  sigBlock.sig = crypto.signText(exports.getHeaderStr(sigBlock.header))
  return sigBlock
}

exports.verifySignature = () => true

exports.hashHeader = blockHeader => crypto.hashText(exports.getHeaderStr(blockHeader))

exports.verifyHash = () => {}

/**
 * Creates a merkle tree out of given txs.
 */
exports.createMerkle = txs => {
  const strs = txs.map(t => tx.getStr(t))
  const merkleTools = new MerkleTools({hashType: crypto.algo})
  merkleTools.addLeaves(strs, true)
  merkleTools.makeTree()
  return merkleTools
}

/**
 * Creates a block with given txs and previous block or block header.
 */
exports.createSignedBlock = (txs, prevBlockOrHeader, mine = false) => {
  const prevHeader = prevBlockOrHeader.header || prevBlockOrHeader
  const header = {
    no: prevHeader.no + 1,
    prevHash: exports.hashHeader(prevHeader),
    txCount: txs.length,
    merkleRoot: (txs.length && exports.createMerkle(txs).getMerkleRoot().toString('base64')) || '',
    time: new Date(),
    difficulty: 0,
    nonce: 0
  }
  let block = {
    sig: '',
    header,
    data: txs
  }
  mine && exports.mineBlock(block)
  return exports.sign(block)
}

/**
 * Verifies a given block header and data (if given).
 */
exports.verifyBlock = block => {
  // verify signature if present

  // verify PoW otherwise
}

/**
 * Returns a merkle proof for a given tx and the merkle tree.
 */
exports.getTxProof = (tx, merkle) => {}

/**
 * Verifies a tx given a block header and merkle proof for that tx.
 */
exports.verifyTxInBlock = (tx, blockHeader, merkleProof) => {}

/**
 * Calculates nonce (mines) until a hash of required difficulty is found for the block.
 */
exports.mineBlock = blockOrHeader => {
  const header = blockOrHeader.header || blockOrHeader
  header.difficulty = 1 // todo: difficulty should depend on average block timer
  const hashPrefix = '0'.repeat(header.difficulty) // todo: this is exponential like growth!

  let hash
  while (true) {
    header.nonce++
    hash = exports.hashHeader(header)
    if (hash.substring(0, header.difficulty) === hashPrefix) {
      console.log(`mined block with nonce: ${header.nonce}, hash: ${hash}`)
      return
    }
  }
}
