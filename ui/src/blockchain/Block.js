import assert from './assert'
import { hashStr, signStr, verifyStr } from './crypto'
import Merkle from './Merkle'
import Tx from './Tx'

export default class Block {
  constructor (sig, no, prevHash, txCount, merkleRoot, time, minDifficulty, nonce, txs) {
    this.sig = sig // optional: if given, difficulty and nonce are not obligatory

    this.no = no
    this.prevHash = prevHash
    this.txCount = txCount
    this.merkleRoot = merkleRoot
    this.time = time
    this.minDifficulty = minDifficulty  // optional: if sig is not present, should be > 0
    this.nonce = nonce // optional: if sig is not present, should be > 0

    this.txs = txs
  }

  /**
   * Very first block ever.
   */
  static getGenesis = () => new Block('', 1, '', 0, '', new Date('01 Jan 2018 00:00:00 UTC'), 0, 0, [])

  /**
   * Creates a block with given txs and previous block, asynchronously.
   */
  static create = async (txs, prevBlock, now = new Date()) => {
    assert(prevBlock instanceof Block, 'Previous block object is not an instance of Block class.')
    txs = txs.map(tx => Tx.getObj(tx))
    return new Block(
      '',
        prevBlock.no + 1,
        await prevBlock.hash(),
        txs.length,
        (txs.length && (await Merkle.create(txs.map(tx => tx.hash()))).root) || '', // block are allowed to have no txs in them
        now,
        0,
        0,
      txs
    )
  }

  /**
   * Creates a block object out of a given plain object.
   */
  static getObj = bo => new Block(
    bo.sig,
      bo.no, bo.prevHash, bo.txCount, bo.merkleRoot,
      bo.time instanceof Date ? bo.time : new Date(bo.time), bo.minDifficulty, bo.nonce,
    bo.txs.map(tx => Tx.getObj(tx))
  )

  /**
   * Deserializes given tx json into a tx object with correct Date type.
   */
  static getObjFromJson = blockJson => Block.getObj(JSON.parse(blockJson))

  /**
   * Serializes the block into JSON string.
   */
  toJson = () => JSON.stringify(this, null, 2)

  /**
   * Returns the hash of the block, asynchronously.
   */
  hash = () => hashStr('' + this.sig + this._toSigningString())

  /**
   * Signs the block with majorna certificate, asynchronously.
   */
  sign = async () => {
    this.sig = await signStr(this._toSigningString())
  }

  /**
   * Verifies the block's signature, asynchronously.
   * Throws an AssertionError if signature is invalid.
   */
  verifySig = () => verifyStr(this.sig, this._toSigningString(), 'Invalid block signature.')

  /**
   * Verifies the block, asynchronously.
   * Returns true if block is valid. Throws an AssertionError with a relevant message, if the verification fails.
   */
  verify = async prevBlock => {
    // verify schema
    assert(prevBlock && typeof prevBlock.no === 'number' && prevBlock.no >= 1, `Null or invalid previous block: ${prevBlock}`)
    assert(this.no === prevBlock.no + 1, `Block number is not correct. Expected ${prevBlock.no + 1}, got ${this.no}.`)
    assert(typeof this.prevHash === 'string', 'Previous block hash should be a string.')
    assert(this.prevHash.length === 64, `Previous block hash length is invalid. Expected ${64}, got ${this.prevHash.length}.`)
    assert(this.txCount === this.txs.length, `Tx count in does not match the actual tx count in block. Expected ${this.txs.length}, got ${this.txCount}.`)
    if (this.txCount) {
      assert(typeof this.merkleRoot === 'string' && this.merkleRoot.length > 0, 'Merkle root should be a non-empty string.')
      assert(this.merkleRoot.length === 64, `Merkle root length is invalid. Expected ${64}, got ${this.merkleRoot.length}.`)
    } else {
      assert(this.merkleRoot === '', 'Merkle root should be an empty string if block contains no txs.')
    }
    assert(this.time instanceof Date, 'Time object must be an instance of Date class.')
    assert(this.time.getTime() > Block.getGenesis().time.getTime(), 'Block time is invalid or is before the genesis.')
    if (this.sig) {
      assert(this.sig.length === 128, `Signature length is invalid. Expected ${128}, got ${this.sig.length}.`)
      this.minDifficulty > 0 && assert(this.nonce > 0, 'Nonce should be > 0 if difficulty is > 0.')
      this.nonce > 0 && assert(this.minDifficulty > 0, 'Difficulty should be > 0 if nonce is > 0.')
    } else {
      assert(this.minDifficulty > 0, 'Block difficulty should be > 0 for unsigned blocks.')
      assert(this.nonce > 0, 'Block nonce should be > 0 for unsigned blocks.')
    }

    // verify contents
    const prevBlockHash = await prevBlock.hash()
    assert(this.prevHash === prevBlockHash, `Given previous block hash does not match. Expected ${prevBlockHash}, got ${this.prevHash}.`)
    if (this.txCount) {
      const merkleRoot = (await Merkle.create(this.txs.map(tx => tx.hash()))).root
      assert(this.merkleRoot === merkleRoot, `Merkle root is not valid. Expected ${merkleRoot}, got ${this.merkleRoot}`)
      for (const tx of this.txs) assert(tx.verify(), `One of the txs in given block was invalid. Invalid tx: ${tx}`)
    }
    if (this.sig) {
      await this.verifySig()
    }
    if (!this.sig || this.minDifficulty > 0 || this.nonce > 0) {
      const hash = await this.hash()
      const difficulty = exports.getHashDifficulty(hash)
      assert(difficulty >= this.minDifficulty,
        `Nonce does not match claimed difficulty. Expected difficulty ${this.minDifficulty}, got ${difficulty} (hash: ${hash}).`)
    }
  }

  /**
   * Concatenates the the given block into a regular string, fit for hashing.
   * Puts the nonce first to prevent internal hash state from being reused. In future we can add more memory intensive prefixes.
   * @param difficulty - If specified, this difficulty will be used instead of the one in
   */
  _toMiningString = difficulty => '' + this.no + this.prevHash + this.txCount + this.merkleRoot + this.time.getTime() + (difficulty || this.minDifficulty)

  /**
   * Concatenates the the given block into a regular string, fit for signing.
   * Nonce as the first item to be consistent with mining string.
   */
  _toSigningString = () => '' + this.nonce + this._toMiningString()
}
