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
  async construct(signedTokens, _inputs, options) {
    let signedBodies = []
    let domain = {}
    let value = new this.web3.utils.BN(0)
    let inputs = []
    for(let i=0; i<signedTokens.length; i++) {
      inputs[i] = {}
      if (_inputs && _inputs[i] && _inputs[i].receiver) {
        inputs[i].receiver = _inputs[i].receiver
      } else {
        inputs[i].receiver = this.account
      }
      for(let key in signedTokens[i].domain) {
        let val = signedTokens[i].domain[key]
        if (domain[key] && domain[key] !== val) {
          // different domain value
          throw new Error("all domains must be the same")
          return
        }
        domain[key] = val
      }
      if (signedTokens[i].body.sendersHash !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        inputs[i].sendersProof = new Merkle({
          web3: this.web3,
          types: ["address"],
          values: signedTokens[i].body.senders.map(m => [m])
        }).proof([this.account])
      } else {
        inputs[i].sendersProof = []
      }
      if (signedTokens[i].body.receiversHash !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        inputs[i].receiversProof = new Merkle({
          web3: this.web3,
          types: ["address"],
          values: signedTokens[i].body.receivers.map(m => [m])
        }).proof([inputs[i].receiver])
      } else {
        inputs[i].receiversProof = []
      }
      if (signedTokens[i].body.puzzleHash !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        if (!_inputs || !_inputs[i] || !_inputs[i].puzzle) throw new Error("missing auth: 'puzzle'")
        inputs[i].puzzle = this.web3.utils.asciiToHex(_inputs[i].puzzle)
      } else {
        inputs[i].puzzle = "0x0000000000000000000000000000000000000000000000000000000000000000"
      }


      // remove the "senders" array and the "cid" attribute from the token
      let body = Object.assign({}, signedTokens[i].body)
      delete body.senders
      delete body.receivers
      delete body.cid

      signedBodies.push(body)
      value = value.add(new this.web3.utils.BN(signedTokens[i].body.value))
    }
    let o;
    if (options) {
      o = Object.assign({}, options)
      if (!value.isZero() && typeof o.value === "undefined") {
        o.value = value.toString()
      }
      o.from = this.account
    } else {
      o = {
        from: this.account,
        value: value.toString()
      }
    }
    return {
      domain,
      signedBodies,
      inputs,
      o
    }
  }
}
module.exports = Contract
