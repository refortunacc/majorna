const crypto = require('crypto')
const config = require('../config/config')

exports.algo = 'SHA256'
exports.encoding = 'base64' // todo: can use DER encoding for signature and save ~20bytes: https://stackoverflow.com/a/39651457/628273 (or compressed ec sig for further reduction)

exports.hashText = text => crypto.createHash(exports.algo).update(text).digest(exports.encoding)

exports.signText = text => crypto.createSign(exports.algo).update(text).sign(config.crypto.privateKey, exports.encoding)

exports.verifyText = (text, sig) => crypto.createVerify(exports.algo).update(text).verify(config.crypto.publicKey, sig, exports.encoding)
