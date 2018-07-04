import config from '../data/config'
import assert from './assert'
window.TextEncoder = window.TextEncoder || class {}
// todo: drop this and always use ArrayBuffer? / at least internally in Tx/Block classes
const textEncoder = new window.TextEncoder(config.crypto.textEncoding)

/**
 * Convert given ArrayBuffer instance to hex encoded string.
 */
export const convertBufferToHexStr = buffer => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')

/**
 * Convert given hex encoded string to ArrayBuffer.
 */
export const convertHexStrToBuffer = hexStr => new Uint8Array(hexStr.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16))).buffer

/**
 * Hashes given ArrayBuffer object, asynchronously. Returns hash as ArrayBuffer.
 */
export const hashBufferToBuffer = buffer => crypto.subtle.digest({name: config.crypto.hashAlgo}, buffer)

/**
 * Hashes given string, asynchronously. Returns hash as ArrayBuffer.
 */
export const hashStrToBuffer = str => hashBufferToBuffer(textEncoder.encode(str))

/**
 * Hashes given string, asynchronously. Returns hash as hex encoded string.
 */
export const hashStrToHexStr = async str => convertBufferToHexStr(await hashStrToBuffer(str))

/**
 * Signs given string, asynchronously. Returned promise resolves to the hex encoded signature.
 */
export const signStrToHexStr = async str => convertBufferToHexStr(await crypto.subtle.sign( // todo: use compressed ec sig (50% reduction) + DER encoding for signature and save ~20bytes: https://stackoverflow.com/a/39651457/628273
  {name: config.crypto.signAlgo, hash: config.crypto.hashAlgo},
  config.crypto.privateKey,
  textEncoder.encode(str)
))

/**
 * Verifies given string with hex encoded signature, asynchronously.
 * Throws an AssertionError if signature is invalid.
 */
export const verifyStrWithHexStrSig = async (sig, str, failureDescription) => assert(await crypto.subtle.verify(
  {name: config.crypto.signAlgo, hash: config.crypto.hashAlgo},
  config.crypto.publicKey,
  convertHexStrToBuffer(sig),
  textEncoder.encode(str)
), failureDescription || 'Invalid signature.')
