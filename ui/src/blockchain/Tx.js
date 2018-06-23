import assert from './assert'
import * as crypto from './crypto'

export default class Tx {
  constructor (sig, id, fromId, fromBalance, toId, toBalance, time, amount) {
    this.sig = sig // signature of the tx, signed by the sender (or majorna on behalf of sender)
    this.id = id // ID of the transaction
    this.from = {
      id: fromId, // ID of the sender
      balance: fromBalance // balance of sender before transaction
    }
    this.to = {
      id: toId, // ID of the receiver
      balance: toBalance // balance of receiver before transaction
    }
    this.time = time // time of the transaction
    this.amount = amount // amount being sent
  }

  /**
   * Verifies the tx, asynchronously.
   * Returns true if tx is valid. Throws an AssertionError with a relevant message, if the verification fails.
   */
  verify = async () => {
    // verify schema
    assert(typeof this.sig === 'string', 'Signature must be a non-empty string.')
    assert(this.sig.length === 88, `Signature length is invalid. Expected ${88}, got ${this.sig.length}.`)
    assert(typeof this.id === 'string' && this.id.length > 0, 'ID must be a non-empty string.')
    assert(typeof this.from.id === 'string' && this.from.id.length > 0, 'From ID must be a non-empty string.')
    assert(typeof this.from.balance === 'number' && this.from.balance >= this.amount, '"From Balance" must be a number that is greater than or equal to the amount being sent.')
    assert(typeof this.to.id === 'string' && this.to.id.length > 0, 'To ID must be a non-empty string.')
    assert(typeof this.to.balance === 'number' && this.to.balance >= 0, '"To Balance" must be a number that is greater than or equal to 0.')
    assert(this.time instanceof Date, 'Time object must be an instance of Date class.')
    assert(typeof this.amount === 'number' && this.amount > 0, 'Amount must be a number that is greater than 0.')

    // verify contents
    assert(this.from.id !== this.to.id, 'To and From IDs cannot be the same.')
    await this.verifySig()
  }

  /**
   * Creates a tx object out of a given object.
   */
  static getObj = tx => new Tx(tx.sig, tx.id, tx.from.id, tx.from.balance, tx.to.id, tx.to.balance, tx.time, tx.amount)

  /**
   * Deserializes given tx json into a tx object with correct Date type.
   */
  static getObjFromJson = txJson => {
    const parsedTx = JSON.parse(txJson)
    parsedTx.time = new Date(parsedTx.time)
    return Tx.getObj(parsedTx)
  }

  /**
   * Serializes the tx into JSON string.
   */
  toJson = () => JSON.stringify(this)

  /**
   * Concatenates the the given tx into a regular string, fit for hashing.
   */
  getStr = () => '' + this.id + this.from.id + this.from.balance + this.to.id + this.to.balance + this.time.getTime() + this.amount

  /**
   * Signs the tx with majorna certificate, asynchronously.
   */
  sign = async () => {
    this.sig = await crypto.signText(this.getStr())
  }

  /**
   * Verifies the tx's signature, asynchronously.
   */
  verifySig = async () => assert(await crypto.verifyText(this.sig, this.getStr()), 'Invalid tx signature.')
}
