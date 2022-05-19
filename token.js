const { CID } = require('multiformats/cid')
const { base32 } = require("multiformats/bases/base32")
const sigUtil = require('@metamask/eth-sig-util')
const cell_abi = require('./abi/Cell.json')
const Contract = require('./contract')
const Merkle = require('./merkle')
class Token extends Contract {
  init(o) {
    o.abi = cell_abi
    return super.init(o)
  }
  methods(address) {
    return super.methods(address) 
  }
  contract(address) {
    return super.contract(address) 
  }
  signer(token) {
    let typed_data = this.typed(token)
    return sigUtil.recoverTypedSignature({
      data: typed_data,
      signature: token.body.signature,
      version: "V4"
    })
  }
  _sign(token) {
    let typed_data = this.typed(token)
    return new Promise((resolve, reject) => {
      if (this.key) {
        let signature = sigUtil.signTypedData({
          privateKey: Buffer.from(this.key, "hex"),
          data: typed_data,
          version: "V4"
        })
        resolve({
          domain: typed_data.domain,
          signature
        })
      } else {
        this.web3.currentProvider.send({
          method: "eth_signTypedData_v4",
          params: [ this.account, JSON.stringify(typed_data) ],
          from: this.account
        }, (err, signature) => {
          if (err) reject (err)
          else resolve({
            domain: typed_data.domain,
            signature: signature.result,
          })
        })
      }
    })
  }
  async sign(unsignedToken) {
    if (!unsignedToken.body) throw new Error("required field: body")
    let { domain, signature } = await this._sign(unsignedToken)
    return {
      body: Object.assign({ signature }, unsignedToken.body),
      domain: domain,
    }
  }
  async create(o) {
    let unsignedToken = await this.build(o)
    let signedToken = await this.sign(unsignedToken)
    return signedToken
  }
  async build(o) {
    //
    //  o :- {
    //    body: {
    //      cid (required),
    //      sender,
    //      receiver,
    //      value,
    //      start,
    //      end,
    //      payments,
    //      owns,
    //      burned,
    //      balance,
    //      senders,
    //      receivers,
    //      puzzle
    //    },
    //    domain: {
    //      name,
    //      chainId,
    //      address
    //    }
    //  }
    //
    if (!o.body) throw new Error("body missing")
    if (!o.domain) throw new Error("domain missing")
    if (!o.body.cid) throw new Error("cid missing");
    let body = o.body
    let domain = o.domain
    const digest = CID.parse(body.cid).multihash.digest
    const bytes = base32.decode(body.cid)
    const inspected = CID.inspectBytes(base32.decode(body.cid)) // inspected.codec: 112 (0x70)
    const codec = inspected.codec
    const id = new this.web3.utils.BN(digest).toString();

    //
    //  burned: [{
    //    who: <"sender"|"receiver">,
    //    where: contract_address,
    //    what: tokenId
    //  }],
    //  owns: [{
    //    who: <"sender"|"receiver">,
    //    where: contract_address,
    //    what: tokenId
    //  }],
    //  balance: [{
    //    who: <"sender"|"receiver">,
    //    where: contract_address (ERC20|ERC721),
    //    what: balance
    //  }]
    //
    let burned = (body.burned ? body.burned : []).map((item) => {
      if (item.who === "sender" || item.who === "receiver") {
        return {
          code: (item.who === "sender" ? 0 : 1),
          addr: (item.where ? item.where : "0x0000000000000000000000000000000000000000"),
          id: item.what,
        }
      } else {
        throw new Error("'who' attribute must be specified")
      }
    })
    let owns = (body.owns ? body.owns : []).map((item) => {
      if (item.who === "sender" || item.who === "receiver") {
        return {
          code: (item.who === "sender" ? 2 : 3),
          addr: (item.where ? item.where : "0x0000000000000000000000000000000000000000"),
          id: item.what,
        }
      } else {
        throw new Error("'who' attribute must be specified")
      }
    })
    let balance = (body.balance ? body.balance : []).map((item) => {
      if (item.who === "sender" || item.who === "receiver") {
        return {
          code: (item.who === "sender" ? 4 : 5),
          addr: (item.where ? item.where : "0x0000000000000000000000000000000000000000"),
          id: item.what,
        }
      } else {
        throw new Error("'who' attribute must be specified")
      }
    })
    let royalty = (body.royalty ? [body.royalty] : []).map((item) => {
      if (item.where && item.what) {
        return {
          code: 11,
          addr: item.where,
          id: item.what,
        }
      } else {
        throw new Error("'where' and 'what' attributes must be specified")
      }
    })
    let payments = (body.payments ? body.payments : []).map((item) => {
      if (item.where && item.what) {
        return {
          code: 10,
          addr: item.where,
          id: item.what,
        }
      } else {
        throw new Error("'where' and 'what' attributes must be specified")
      }
    })
    let relations = [].concat(burned).concat(owns).concat(balance).concat(royalty).concat(payments)
    let r = {
      domain: {
        name: domain.name,
        chainId: domain.chainId,
        verifyingContract: domain.address,
        version:  "1"
      },
      body: {
        cid: body.cid,
        id: id,
        encoding: (codec === 85 ? 0 : 1),  // 0x55 is raw (0), 0x70 is dag-pb (1)
        sender: (body.sender ? body.sender : "0x0000000000000000000000000000000000000000"),
        receiver: (body.receiver ? body.receiver : "0x0000000000000000000000000000000000000000"),
        value: "" + (body.value ? body.value : 0),
        start: "" + (body.start ? body.start : 0),
        end: "" + (body.end ? body.end : new this.web3.utils.BN(2).pow(new this.web3.utils.BN(64)).sub(new this.web3.utils.BN(1)).toString()),
        relations,
      }
    }
    // senders merkle proof
    if (o.body.senders) {
      r.body.sendersHash = new Merkle({
        web3: this.web3,
        types: ["address"],
        values: o.body.senders.map(m => [m])
      }).root()
      r.body.senders = o.body.senders
    } else {
      r.body.senders = []
      r.body.sendersHash = "0x0000000000000000000000000000000000000000000000000000000000000000"
    }
    // receivers merkle proof
    if (o.body.receivers) {
      r.body.receiversHash = new Merkle({
        web3: this.web3,
        types: ["address"],
        values: o.body.receivers.map(m => [m])
      }).root()
      r.body.receivers = o.body.receivers
    } else {
      r.body.receivers = []
      r.body.receiversHash = "0x0000000000000000000000000000000000000000000000000000000000000000"
    }
    // hash puzzle
    if (o.body.puzzle) {
      r.body.puzzleHash = this.web3.utils.soliditySha3(o.body.puzzle)
    } else {
      r.body.puzzleHash = "0x0000000000000000000000000000000000000000000000000000000000000000"
    }
    return r
  }
  async burn(address, ids) {
    let tx = await this.methods(address).burn(ids).send({
      from: this.account
    })
    return tx
  }
  async send(signedTokens, _inputs, options) {
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
    let tx = await this.methods(domain.verifyingContract).token(signedBodies, inputs).send(o)
    return tx
  }
  typed(token) {
    const data = {
      domain: token.domain,
      message: Object.assign({}, token.body),
      primaryType: "Body",
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Relation: [
          { name: "code", type: "uint8" },
          { name: "addr", type: "address" },
          { name: "id", type: "uint256" },
        ],
        Body: [
          { name: "id", type: "uint256" },
          { name: "encoding", type: "uint8" },
          { name: "sender", type: "address" },
          { name: "receiver", type: "address" },
          { name: "value", type: "uint128" },
          { name: "start", type: "uint64" },
          { name: "end", type: "uint64" },
          { name: "sendersHash", type: "bytes32" },
          { name: "receiversHash", type: "bytes32" },
          { name: "puzzleHash", type: "bytes32" },
          { name: "relations", type: "Relation[]" },
        ],
      }
    }
    delete data.message.cid
    return data;
  }
}
module.exports = Token
