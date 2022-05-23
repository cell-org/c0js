const Errors = require('./errors')
const extract = require('extract-json-from-string');
class Contract {
  // must have the attributes:
  //  - abi
  //  - key
  //  - contract
  //  - account
  //  - address
  //  - wallet
  //  - web3
  init(o) {
    this.web3 = o.web3
    this.key = o.key
    this.abi = o.abi
    this.account = o.account
    this.wallet = o.wallet
  }
  contract(address) {
    let contract = new this.web3.eth.Contract(this.abi, address)
    return contract
  }
  handleError(e) {
    let error = extract(e.message)
    if (error.length > 0) {
      error = error[0]
      if (error.originalError) {
        let match = /execution reverted: (.+)$/.exec(error.originalError.message)
        if (match && match.length > 0) {
          let code = match[1]
          let message = Errors["" + code]
          error.message = message
          error.code = code
        }
      }
      throw error
    } else {
      throw e
    }
  }
  methods(address) {
    let contract = new this.web3.eth.Contract(this.abi, address)
    let api = {}
    let methods = this.abi.filter((item) => { return item.type === 'function' })
    if (this.key) {
      // node.js
      for(let method of methods) {
        api[method.name] = (...args) => {
          return {
            send: async (param) => {
              let action = contract.methods[method.name](...args)
              let data = action.encodeABI()
              let o = {
                from: (param && param.from ? param.from : this.account),
                to: address,
                data: data,
              }
              if (param && param.value) o.value = param.value
              if (param && param.gas) o.gas = param.gas
              if (param && param.gasPrice) o.gasPrice = param.gasPrice
              let estimate = await action.estimateGas(o)
              o.gas = estimate
              const signedTx = await this.wallet.signTransaction(o)
              try {
                let tx = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
                return tx
              } catch (e) {
                this.handleError(e)
              }
            },
            call: (param) => {
              return contract.methods[method.name](...args).call(param)
            },
          }
        }
      }
    } else {
      // browser
      for(let method of methods) {
        api[method.name] = (...args) => {
          return {
            send: async (param) => {
              let o = {
                from: (param && param.from ? param.from : this.account),
              }
              if (param && param.value) o.value = param.value
              if (param && param.gas) o.gas = param.gas
              if (param && param.gasPrice) o.gasPrice = param.gasPrice
              try {
                let estimate = await contract.methods[method.name](...args).estimateGas(o)
                let r = await contract.methods[method.name](...args).send(o)
                return r
              } catch (e) {
                this.handleError(e)
              }
            },
            call: async (param) => {
              let o = {
                from: (param && param.from ? param.from : this.account),
              }
              if (param && param.value) o.value = param.value
              let r = await contract.methods[method.name](...args).call(o)
              return r
            },
            estimate: async (param) => {
              let o = {
                from: (param && param.from ? param.from : this.account),
              }
              if (param && param.value) o.value = param.value
              if (param && param.gas) o.gas = param.gas
              if (param && param.gasPrice) o.gasPrice = param.gasPrice
              try {
                let estimate = await contract.methods[method.name](...args).estimateGas(o)
                return estimate
              } catch (e) {
                this.handleError(e)
              }
            }
          }
        }
      }
    }
    return api
  }
}
module.exports = Contract
