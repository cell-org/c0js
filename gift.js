const { CID } = require('multiformats/cid')
const { base32 } = require("multiformats/bases/base32")
const cell_abi = require('./abi/Cell.json')
const Contract = require('./contract')
class Gift extends Contract {
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
  async create(o) {
    console.log("O", o)
    if (!o) throw new Error("body & domain missing")
    if (!o.body) throw new Error("body missing")
    if (!o.domain) throw new Error("domain missing")
    let body = o.body
    let domain = o.domain
    //  o := {
    //    body: {
    //      cid,                      // required
    //      receiver,                 // required
    //      royaltyReceiver,          // optional
    //      royaltyAmount             // optional
    //    },
    //    domain: <domain>
    //  }
    if (!body.cid) throw new Error("required field: cid")
    if (!body.receiver) throw new Error('required field: receiver')
    const digest = CID.parse(body.cid).multihash.digest
    const bytes = base32.decode(body.cid)
    const inspected = CID.inspectBytes(base32.decode(body.cid)) // inspected.codec: 112 (0x70)
    const codec = inspected.codec
    const id = new this.web3.utils.BN(digest).toString();
    return {
      body: {
        cid: body.cid,
        id: id,
        raw: (codec === 85),  // 0x55 is raw, 0x70 is dag-pb
        receiver: body.receiver,
        royaltyReceiver: (body.royaltyReceiver ? body.royaltyReceiver : "0x0000000000000000000000000000000000000000"),
        royaltyAmount: "" + (body.royaltyAmount ? body.royaltyAmount : 0),
      },
      domain: {
        name: domain.name,
        chainId: domain.chainId,
        verifyingContract: domain.address,
        version:  "1"
      },
    }
  }
  async send(gifts) {
    //  gift := {
    //    body: {
    //      cid,                  // metadata cid (must be removed before submitting to the blockchain)
    //      id,                   // tokenId
    //      raw,                  // true/false
    //      receiver,             // receiver address
    //      royaltyReceiver,      // royalty receiver
    //      royaltyAmount,        // royalty amount
    //    },
    //    domain: {
    //      address,              // contract address
    //      chainId,              // chainId
    //    }
    //  }
    // remove cid
    let payloads = []
    let chainId = await this.web3.eth.getChainId()
    let domain
    for(let gift of gifts) {
      if (!gift.body) throw new Error("body missing")
      if (!gift.domain) throw new Error("domain missing")
      if (gift.domain.chainId !== chainId) {
        throw new Error("chainId does not match the current network")
      }
      let g = Object.assign({}, gift.body)
      delete g.cid
      payloads.push(g)
      domain = gift.domain
    }
    let tx = await this.methods(domain.verifyingContract).gift(payloads).send({ from: this.account, })
    return tx
  }
}
module.exports = Gift
