const assert = require('assert')
const crypto = require('./crypto')

suite('crypto', () => {
  test('sign-verify', () => {
    const text = 'lorem ipsum dolor'
    const sig = crypto.sign(text)
    assert(crypto.verify(text, sig))

    const text2 = 'asdf89u -098sd7fsadufih sadfh0isaudf09-2ui3/;sd3/.,mOI_(*YT*(^FTIDTXipf90as.sdafsdas djf-9i1j?KJPOih-9?oiuasdf83348'
    const sig2 = crypto.sign(text2)
    assert(crypto.verify(text2, sig2))

    assert(sig2.length < 100, `signature length was: ${sig2.length}`)
  })

  test('signTx', () => {
    const obj = {wow: 'yeah'}
    const sigObj = crypto.signTx(obj)
    assert(sigObj.sig)
    assert(sigObj.sig.length > 50)
    assert(sigObj.data.wow === 'yeah')
  })
})