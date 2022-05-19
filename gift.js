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
    if (!o) throw new Error("body & domain missing")
    if (!o.body) throw new Error("body missing")
    if (!o.domain) throw new Error("domain missing")
    let body = o.body
    let domain = o.domain
    //  o := {
    //    body: {
    //      cid,                      // required
    //      receiver,                 // required
    //      payments,                 // optional
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
    const relations = (body.royalty ? [body.royalty] : []).map((item) => {
      if (item.where && item.what) {
        return {
          code: 11,
          addr: item.where,
          id: item.what,
        }
      } else {
        throw new Error("'where' and 'what' attributes required")
      }
    })
    return {
      body: {
        cid: body.cid,
        id: id,
        encoding: (codec === 85 ? 0 : 1),  // 0x55 is raw (0), 0x70 is dag-pb (1)
        receiver: body.receiver,
        relations
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
    //      encoding,             // 0 (raw) / 1 (dag-pb)
    //      receiver,             // receiver address
    //      payments,             // payments
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
