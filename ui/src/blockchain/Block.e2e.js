import assert from './assert'
import Block, { getHashDifficulty } from './Block'
import Tx from './Tx'

const getSampleBlock = () => new Block('', 2, 0, '', new Date(), 0, 0, [])

const getSampleTxs = async () => {
  const tx1 = new Tx(null, 'tx-123', '1', 500, '2', 500, new Date(), 25)
  await tx1.sign()
  const tx2 = new Tx(null, 'tx-456', '2', 525, '1', 475, new Date(), 10)
  await tx2.sign()
  return [tx1, tx2]
}

export default {
  'constructor': async () => {
    const block = getSampleBlock()
    assert(block)
  },

  'getGenesis': () => {
    // verify genesis fields
    const genesis = Block.getGenesis()
    assert(genesis instanceof Block)
    assert(genesis.sig === '')
    assert(genesis.no === 1)
    assert(genesis.prevHash === '')
    assert(genesis.txCount === 0)
    assert(genesis.merkleRoot === '')
    assert(genesis.time.getTime() === new Date('01 Jan 2018 00:00:00 UTC').getTime())
    assert(genesis.minDifficulty === 0)
    assert(genesis.nonce === 0)
    assert(Array.isArray(genesis.txs))
    assert(genesis.txs.length === 0)

    // verify immutability
    genesis.no = 10
    const genesis2 = Block.getGenesis()
    assert(genesis2.no === 1)
  },

  'hash': async () => {
    const genesis = Block.getGenesis()
    const hash = await genesis.hashToHexStr()
    assert(hash.length === 64)
  },

  'create': async () => {
    const genesis = Block.getGenesis()
    const blockNo2 = await Block.create(await getSampleTxs(), genesis)
    assert(blockNo2 instanceof Block)

    await blockNo2.sign()
    await blockNo2.verify(genesis)

    blockNo2.sig = 'xxxxx' + blockNo2.sig.substring(5, blockNo2.sig.length)
    await assert.throws(() => blockNo2.verify(genesis), 'invalid block signature')
  },

  'toJson, fromJson': async () => {
    const genesis = Block.getGenesis()
    const newBlock = await Block.create(await getSampleTxs(), genesis)
    await newBlock.sign()

    const blockJson = newBlock.toJson()
    const parsedBlock = Block.getObjFromJson(blockJson)

    await parsedBlock.verify(genesis)
    assert(parsedBlock.time.getTime() === newBlock.time.getTime())
    assert(parsedBlock.txs[0].time.getTime() === newBlock.txs[0].time.getTime())
  },

  'sign, verifySign': async () => {
    // make sure that signing does not invalidate a block
    const genesis = Block.getGenesis()
    const signedBlock = await Block.create(await getSampleTxs(), genesis)
    await signedBlock.sign()
    await signedBlock.verifySig()

    // sign same block a second time and make sure that signatures turn out different (ec signing uses rng) but still valid
    const oldSig = signedBlock.sig
    await signedBlock.sign()
    await signedBlock.verifySig()
    assert.notEqual(oldSig, signedBlock.sig)
  },

  'getHashDifficulty': () => {
    // using Uint8Array
    const hash = new Uint8Array(3)
    hash[0] = 0
    hash[1] = 0
    hash[2] = 16
    const difficulty = getHashDifficulty(hash)
    assert(difficulty === 19)

    const hash2 = new Uint8Array(0)
    const difficulty2 = getHashDifficulty(hash2)
    assert(difficulty2 === 0)

    const hash3 = new Uint8Array(1)
    hash3[0] = 128
    const difficulty3 = getHashDifficulty(hash3)
    assert(difficulty3 === 0)

    // using Buffer
    // const hash4 = Buffer.alloc(2)
    // hash4[0] = 1
    // hash4[1] = 200
    // const difficulty4 = getHashDifficulty(hash4)
    // assert(difficulty4 === 7)
  },

  'verify': async () => {
    // verify the fields of assertion error
    try {
      assert(2 === 4, 'lorem')
    } catch (e) {
      assert(e.type === 'AssertionError')
      assert(e.message === 'lorem')
    }

    // verify assert.throws validation
    await assert.throws(async () => { throw new Error('wow') }, 'wow')

    // verify a valid signed and mined block
    const txs = await getSampleTxs()
    const genesis = Block.getGenesis()
    const signedBlock = await Block.create(txs, genesis)
    await signedBlock.sign()
    await signedBlock.verify(genesis)

    const minedBlock = await Block.create(txs, genesis)
    minedBlock.minDifficulty = 1
    await minedBlock.mine()
    await minedBlock.verify(genesis)

    // invalid sig
    const noSigBlock = await Block.create(txs, genesis)
    await assert.throws(() => noSigBlock.verify(), 'previous block')
    await assert.throws(() => noSigBlock.verify(genesis), 'difficulty')

    // invalid nonce
    const invalidNonceBlock = await Block.create(txs, genesis)
    invalidNonceBlock.minDifficulty = 600
    invalidNonceBlock.nonce = 100
    await assert.throws(() => invalidNonceBlock.verify(genesis), 'claimed difficulty')

    // invalid prev hash
    const invalidPrevHashBlock = await Block.create(txs, genesis)
    await invalidPrevHashBlock.sign()
    invalidPrevHashBlock.prevHash = 'Ypy9HtozxoOUejr7SLdqPbsJsBB39wqdzCcBOv3gaZ2O'
    await assert.throws(() => invalidPrevHashBlock.verify(genesis), 'previous block hash')

    // invalid tx count
    const invalidTxCountBlock = await Block.create(txs, genesis)
    await invalidTxCountBlock.sign()
    invalidTxCountBlock.txCount = 5
    await assert.throws(() => invalidTxCountBlock.verify(genesis), 'count in')

    // invalid merkle root
    const invalidMerkleRootBlock = await Block.create(txs, genesis)
    await invalidMerkleRootBlock.sign()
    invalidMerkleRootBlock.merkleRoot = '4aMCaTeNGYtd9Wgcz4j4X6SNzCtHYhUZQPG9pUG9Xz7Tghsadpfiuhsadf098372'
    await assert.throws(() => invalidMerkleRootBlock.verify(genesis), 'root is not valid')

    // invalid time
    const invalidTimeBlock = await Block.create(txs, genesis)
    await invalidTimeBlock.sign()
    invalidTimeBlock.time = new Date('01 Jan 2010 00:00:00 UTC')
    await assert.throws(() => invalidTimeBlock.verify(genesis), 'time is invalid')

    // invalid tx
    const invalidTxBlock = await Block.create(txs, genesis)
    await invalidTxBlock.sign()
    invalidTxBlock.txs[0].sig = '12234'
    await assert.throws(() => invalidTxBlock.verify(genesis), 'txs in given')
  },

  'mineBlock': () => {
    // const minedBlock = await Block.create(await getSampleTxs(), genesis)
    // minedBlock.minDifficulty = 8
    // const miningRes = block.mineBlock(minedBlock)
    //
    // assert(miningRes.hashBase64.substring(0, 1) === 'A')
    // assert(minedBlock.nonce > 0)
    //
    // block.verify(minedBlock, genesis)
  },

  'mineBlock with empty txs': () => {
    // const emptyTxs = []
    // const minedBlock = block.create(emptyTxs, genesis)
    // minedBlock.minDifficulty = 4
    // block.mineBlock(minedBlock)
    //
    // block.verify(minedBlock, genesis)
  }
}
