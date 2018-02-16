const assert = require('assert')
const crypto = require('crypto')
const config = require('../config/config')

const algo = 'SHA256'
const encoding = 'base64' // todo: can use DER encoding for signature and save ~20bytes: https://stackoverflow.com/a/39651457/628273 (or compressed ec sig for further reduction)

exports.sign = text => {
  return crypto.createSign(algo).update(text).sign(config.crypto.privateKey, encoding)
}

exports.verify = (text, signature) => {
  return crypto.createVerify(algo).update(text).verify(config.crypto.publicKey, signature, encoding)
}

/**
 * Wraps a given object into a new object with its signature:
 * Input: {field1: ..., field2: ...}
 * Output: {sig: 'base64_encoded_sig', data: {field1: ..., field2: ...}}
 */
exports.signObj = obj => {
  const str = JSON.stringify(obj)
  const sig = exports.sign(str)
  assert(exports.verify(str, sig))
  return {sig, data: obj}
}
