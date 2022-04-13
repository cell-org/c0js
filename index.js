const fetch = require('cross-fetch');
const { create } = require("multiformats/hashes/digest")
const { CID } = require('multiformats/cid')
const { base32 } = require("multiformats/bases/base32")
const Collection = require('./collection')
const Token = require('./token')
const Util = require('./util')
class C0 {
  constructor() {
    this.collection = new Collection()
    this.token = new Token()
    this.util = new Util()
  }
  async init(o) {
    this.web3 = o.web3
    this.key = o.key

    if (this.key) {
      this.wallet = this.web3.eth.accounts.privateKeyToAccount("0x" + this.key)
      this.account = this.wallet.address
    } else {
      this.key = null
      this.wallet = null
      try {
        if (globalThis.ethereum) {
          await globalThis.ethereum.request({ method: 'eth_requestAccounts' })
        }
        let _res = await this.web3.eth.getAccounts()
        this.account = _res[0];
      } catch (e) {
        if (!o.force) {
          throw e
        }
      }
    }

    o.account = this.account
    o.wallet = this.wallet

    this.collection.init(o)
    this.token.init(o)
    this.util.init(o)
  }
}
module.exports = C0
