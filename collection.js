const factory_abi = require("./abi/Factory.json")
const Contract = require('./contract')
const Token = require('./token')
class Collection extends Contract {
  init(o) {
    o.abi = factory_abi
    return super.init(o)
  }
  methods(address) {
    return super.methods(address) 
  }
  contract(address) {
    return super.contract(address) 
  }
  async create(o, option) {
    const chainId = await this.web3.eth.getChainId();
    let payload = Object.assign({ from: this.account }, option)
    if (!o.name || !o.symbol || typeof o.index === "undefined" || !o.factory) throw new Error("the create object must include 'factory', 'name', 'symbol', and 'index' attributes")
    let tx = await this.methods(o.factory).genesis(o.index, o.name, o.symbol).send(payload)
    return tx
  }
  async create2(c, option) {
    if (!c.name || !c.symbol || typeof c.index === "undefined" || !c.factory || !c.signer) throw new Error("the create object must include 'factory', 'name', 'symbol', 'index', and 'signer' attributes")
    let payload = Object.assign({ from: this.account }, option)
    let tx = await this.methods(c.factory).genesis2(c.index, c.name, c.symbol, c.signer).send(payload)
    return tx
  }
  async create3(c, option) {
    if (!c.name || !c.symbol || typeof c.index === "undefined" || !c.factory || !c.signer) throw new Error("the create object must include 'factory', 'name', 'symbol', 'index', and 'signer' attributes")

    if (!c.tokens) c.tokens = []
    if (!c.inputs) c.inputs = []

    let { domain, signedBodies, inputs, o } = await super.construct(c.tokens, c.inputs, option)

    let tx = await this.methods(c.factory).genesis3(c.index, c.name, c.symbol, c.signer, signedBodies, inputs).send(o)
    return tx
  }
  async find(query) {
    if (!query.creator || !query.factory || !query.implementation) throw new Error("query object requires 'creator', 'factory', and 'implementation' attributes")
    const creator = query.creator
    const start = (query.start ? query.start : 0)
    const count = (query.count ? query.count : 100)
    let addresses = []
    for(let i=start; i<start+count; i++) {
      const salt = this.web3.utils.soliditySha3(creator, i)
      const bytecode = `0x3d602d80600a3d3981f3363d3d373d3d3d363d73${query.implementation.slice(2)}5af43d82803e903d91602b57fd5bf3`
      const parts = [
        'ff',
        query.factory.slice(2),
        salt.slice(2),
        this.web3.utils.sha3(bytecode).slice(2),
      ]
      const partsHash = this.web3.utils.sha3(`0x${parts.join('')}`)
      addresses.push(`0x${partsHash.slice(-40)}`.toLowerCase())
    }
    return addresses
  }
}
module.exports = Collection
