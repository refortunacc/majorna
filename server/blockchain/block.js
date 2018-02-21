const MerkleTools = require('merkle-tools')
const crypto = require('./crypto')

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
    time: Date.parse('01 Jan 2018 00:00:00 GMT'),
    difficulty: 0, // optional: if sig is not present, should be > 0
    nonce: 0 // optional: if sig is not present, should be > 0
  },
  data: []
}

/**
 * Creates a merkle tree out of given array of objects.
 */
exports.createMerkle = arr => {
  const merkleTools = new MerkleTools({hashType: 'sha256'})
  merkleTools.addLeaves(arr, true)
  merkleTools.makeTree()
  return merkleTools
}

/**
 * Creates a block with given txs and previous block or block header.
 */
exports.createSignedBlock = (txs, prevBlock, mine = false) => {
  const prevHeader = prevBlock.header || prevBlock
  const header = {
    no: prevHeader.no + 1,
    prevHash: crypto.hashObj(prevHeader),
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
  block.sig = crypto.signObj(header)
  return block
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
exports.mineBlock = block => {
  const header = block.header
  header.difficulty = 1 // todo: difficulty should depend on average block timer
  const hashPrefix = '0'.repeat(header.difficulty) // todo: this is exponential like growth!

  let hash
  while (true) {
    header.nonce++
    hash = crypto.hashObj(header)
    if (hash.substring(0, header.difficulty) === hashPrefix) {
      console.log(`mined block with nonce: ${header.nonce}, hash: ${hash}`)
      return
    }
  }
}
