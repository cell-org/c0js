const { create } = require("multiformats/hashes/digest")
const { CID } = require('multiformats/cid')
const { base32 } = require("multiformats/bases/base32")
const Collection = require('./collection')
const Token = require('./token')
const Gift = require('./gift')
const Util = require('./util')
class C0 {
  constructor() {
    this.collection = new Collection()
    this.token = new Token()
    this.util = new Util()
    this.gift = new Gift()
  }
  async init(o) {
    this.web3 = o.web3
    this.key = o.key
    this.chainId = o.chain

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

    if (this.chainId) {
      let chainId = await this.web3.eth.getChainId()
      // if the chainId is specified, it must match the currently connected chain
      if (parseInt(chainId) === parseInt(this.chainId)) {
        // correct. do nothing
      } else {
        throw new Error(`[Error] Wrong network. Expected chainId ${this.chainId}, but connected to ${chainId}`); 
      }
    } else {
      // if the chainId is not specified, pass.
    }
    this.collection.init(o)
    this.token.init(o)
    this.util.init(o)
    this.gift.init(o)

  }
}
module.exports = C0
