const fetch = require('cross-fetch');
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
  //
  //  body := {
  //    cid,
  //    minter,
  //    price,
  //    start,
  //    end,
  //    royaltyReceiver,
  //    royaltyAmount,
  //    minters,
  //    puzzle
  //  }
  //
  async build(o) {
    if (!o.body) throw new Error("body missing")
    if (!o.domain) throw new Error("domain missing")
    if (!o.body.cid) throw new Error("cid missing");
    let body = o.body
    let domain = o.domain
    const digest = CID.parse(body.cid).multihash.digest
    const bytes = base32.decode(body.cid)
    const inspected = CID.inspectBytes(base32.decode(body.cid)) // inspected.codec: 112 (0x70)
    const codec = inspected.codec
    //const id = "0x" + digest.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
    const id = new this.web3.utils.BN(digest).toString();
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
        raw: (codec === 85),  // 0x55 is raw, 0x70 is dag-pb
        minter: (body.minter ? body.minter : "0x0000000000000000000000000000000000000000"),
        price: "" + (body.price ? body.price : 0),
        start: "" + (body.start ? body.start : 0),
        end: "" + (body.end ? body.end : new this.web3.utils.BN(2).pow(new this.web3.utils.BN(64)).sub(new this.web3.utils.BN(1)).toString()),
        royaltyReceiver: (body.royaltyReceiver ? body.royaltyReceiver : "0x0000000000000000000000000000000000000000"),
        royaltyAmount: "" + (body.royaltyAmount ? body.royaltyAmount : 0),
      }
    }

    // advanced auth
    if (o.body.minters) {
      r.body.merkleHash = new Merkle({
        web3: this.web3,
        types: ["address"],
        values: o.body.minters.map(m => [m])
      }).root()
      r.body.minters = o.body.minters
    } else {
      r.body.minters = []
      r.body.merkleHash = "0x0000000000000000000000000000000000000000000000000000000000000000"
    }
    if (o.body.puzzle) {
      r.body.puzzleHash = this.web3.utils.soliditySha3(o.body.puzzle)
    } else {
      r.body.puzzleHash = "0x0000000000000000000000000000000000000000000000000000000000000000"
    }
    return r
  }
  async gift(body) {
    //  body := {
    //      cid,                      // required
    //      receiver,                 // required
    //      royaltyReceiver,          // optional
    //      royaltyAmount             // optional
    //  }
    if (!body.cid) throw new Error("required field: cid")
    if (!body.receiver) throw new Error('required field: receiver')
    const digest = CID.parse(body.cid).multihash.digest
    const bytes = base32.decode(body.cid)
    const inspected = CID.inspectBytes(base32.decode(body.cid)) // inspected.codec: 112 (0x70)
    const codec = inspected.codec
    const id = new this.web3.utils.BN(digest).toString();
    return {
      cid: body.cid,
      id: id,
      raw: (codec === 85),  // 0x55 is raw, 0x70 is dag-pb
      receiver: body.receiver,
      royaltyReceiver: (body.royaltyReceiver ? body.royaltyReceiver : "0x0000000000000000000000000000000000000000"),
      royaltyAmount: "" + (body.royaltyAmount ? body.royaltyAmount : 0),
    }
  }
  async give(gifts, domain) {
    //  gift := {
    //    cid,                  // metadata cid (must be removed before submitting to the blockchain)
    //    id,                   // tokenId
    //    raw,                  // true/false
    //    receiver,             // receiver address
    //    royaltyReceiver,      // royalty receiver
    //    royaltyAmount,        // royalty amount
    //  }
    //  domain := {
    //    address,              // contract address
    //    chainId,              // chainId
    //  }
    let chainId = await this.web3.eth.getChainId()
    if (domain.chainId !== chainId) {
      throw new Error("chainId does not match the current network")
    }
    // remove cid
    let payloads = []
    for(let gift of gifts) {
      payloads.push({
        id: gift.id,
        raw: gift.raw,
        receiver: gift.receiver,
        royaltyReceiver: gift.royaltyReceiver,
        royaltyAmount: gift.royaltyAmount
      })
    }
    let tx = await this.methods(domain.address).give(payloads).send({ from: this.account, })
    return tx
  }
  async mint(signedTokens, auths, options) {
    let signedBodies = []
    let domain = {}
    let value = new this.web3.utils.BN(0)
    let proofs = []
    for(let i=0; i<signedTokens.length; i++) {
      proofs[i] = {}
      for(let key in signedTokens[i].domain) {
        let val = signedTokens[i].domain[key]
        if (domain[key] && domain[key] !== val) {
          // different domain value
          throw new Error("all domains must be the same")
          return
        }
        domain[key] = val
      }
      if (signedTokens[i].body.merkleHash !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        proofs[i].merkle = new Merkle({
          web3: this.web3,
          types: ["address"],
          values: signedTokens[i].body.minters.map(m => [m])
        }).proof([this.account])
      } else {
        proofs[i].merkle = []
      }
      if (signedTokens[i].body.puzzleHash !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        if (!auths[i].puzzle) throw new Error("missing auth: 'puzzle'")
        proofs[i].puzzle = this.web3.utils.asciiToHex(auths[i].puzzle)
      } else {
        proofs[i].puzzle = "0x0000000000000000000000000000000000000000000000000000000000000000"
      }

      // remove the "minters" array and the "cid" attribute from the token
      let body = Object.assign({}, signedTokens[i].body)
      delete body.minters
      delete body.cid

      signedBodies.push(body)
      value = value.add(new this.web3.utils.BN(signedTokens[i].body.price))
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
    let tx = await this.methods(domain.verifyingContract).mint(signedBodies, proofs).send(o)
    return tx
  }
//  cid(tokenBody) {
//    if (!tokenBody) throw new Error("must pass a token object with 'id' and 'raw' attributes")
//    if (!tokenBody.id) throw new Error('id missing');
//    const code = (tokenBody.raw ? 85 : 112);
//    const multiHashCode = 18  // sha256
//    const hexId = this.web3.utils.toHex(tokenBody.id)
//    const padded = hexId.slice(2).padStart(64, '0')
//    const d = Uint8Array.from(Buffer.from(padded, 'hex'));
//    const digest = create(multiHashCode, d)
//    return CID.create(1, code, digest).toString()
//  }
//  tokenURI(tokenBody) {
//    return "ipfs://" + this.cid(tokenBody)
//  }
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
        Body: [
          { name: "id", type: "uint256" },
          { name: "raw", type: "bool" },
          { name: "minter", type: "address" },
          { name: "price", type: "uint128" },
          { name: "start", type: "uint64" },
          { name: "end", type: "uint64" },
          { name: "royaltyReceiver", type: "address" },
          { name: "royaltyAmount", type: "uint96" },
          { name: "merkleHash", type: "bytes32" },
          { name: "puzzleHash", type: "bytes32" },
        ],
      }
    }
    delete data.message.cid
    return data;
  }
}
module.exports = Token
