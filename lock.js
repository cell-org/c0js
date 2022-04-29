const { CID } = require('multiformats/cid')
const { base32 } = require("multiformats/bases/base32")
const cell_abi = require('./abi/Cell.json')
const Contract = require('./contract')
const Merkle = require('./merkle')
class Lock extends Contract {
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
    //  body := {
    //      cid,                      // required
    //  }
    if (!body.cid) throw new Error("required field: cid")
    const digest = CID.parse(body.cid).multihash.digest
    const bytes = base32.decode(body.cid)
    const inspected = CID.inspectBytes(base32.decode(body.cid)) // inspected.codec: 112 (0x70)
    console.log("SFSDFSDF")
    const codec = inspected.codec
    const id = new this.web3.utils.BN(digest).toString();
    let r = {
      cid: body.cid,
      id: id,
      value: "" + (body.value ? body.value : 0),
      start: "" + (body.start ? body.start : 0),
      end: "" + (body.end ? body.end : new this.web3.utils.BN(2).pow(new this.web3.utils.BN(64)).sub(new this.web3.utils.BN(1)).toString()),
      raw: (codec === 85),  // 0x55 is raw, 0x70 is dag-pb
      sender: (body.sender ? body.sender : "0x0000000000000000000000000000000000000000"),
      receiver: (body.receiver ? body.receiver : "0x0000000000000000000000000000000000000000"),
    }
    console.log("R", r)
    // advanced auth
    if (body.senders) {
      r.merkleHash = new Merkle({
        web3: this.web3,
        types: ["address"],
        values: body.senders.map(m => [m])
      }).root()
      r.senders = body.senders
    } else {
      r.senders = []
      r.merkleHash = "0x0000000000000000000000000000000000000000000000000000000000000000"
    }
    if (body.puzzle) {
      r.puzzleHash = this.web3.utils.soliditySha3(body.puzzle)
    } else {
      r.puzzleHash = "0x0000000000000000000000000000000000000000000000000000000000000000"
    }
    return {
      body: r,
      domain: {
        name: domain.name,
        chainId: domain.chainId,
        verifyingContract: domain.address,
        version:  "1"
      },
    };
  }
  async send(locks) {
    let chainId = await this.web3.eth.getChainId()
    // remove cid
    let payloads = []
    let domain
    for(let lock of locks) {
      if (!lock.body) throw new Error("body missing")
      if (!lock.domain) throw new Error("domain missing")
      if (lock.domain.chainId !== chainId) {
        throw new Error("chainId does not match the current network")
      }
      //  lock := {
      //    body: {
      //      cid,
      //      id,
      //      value,
      //      start,
      //      end,
      //      raw,
      //      sender,
      //      receiver,
      //      senders,
      //      merkleHash,
      //      puzzleHash
      //    },
      //    domain: <domain>
      //  }
      let l = Object.assign({}, lock.body)
      delete l.senders
      delete l.cid
      //  struct Lock {
      //    uint256 id;
      //    uint128 value;
      //    uint64 start;
      //    uint64 end;
      //    bool raw; // 0: dag-pb, 1: raw
      //    address sender;
      //    address receiver;
      //    bytes32 merkleHash;
      //    bytes32 puzzleHash;
      //  }
      payloads.push(l)
      domain = lock.domain
    }
    console.log("payload", payloads)
    let tx = await this.methods(domain.verifyingContract).lock(payloads).send({ from: this.account, })
    return tx
  }
  async unlock(locks, auths, options) {
    let bodies = []
    let domain = {}
    let value = new this.web3.utils.BN(0)
    let proofs = []
    for(let i=0; i<locks.length; i++) {
      proofs[i] = {}
      for(let key in locks[i].domain) {
        let val = locks[i].domain[key]
        if (domain[key] && domain[key] !== val) {
          // different domain value
          throw new Error("all domains must be the same")
          return
        }
        domain[key] = val
      }
      if (locks[i].body.merkleHash !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        proofs[i].merkle = new Merkle({
          web3: this.web3,
          types: ["address"],
          values: locks[i].body.senders.map(m => [m])
        }).proof([this.account])
      } else {
        proofs[i].merkle = []
      }
      if (locks[i].body.puzzleHash !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        if (!auths || !auths[i] || !auths[i].puzzle) throw new Error("missing auth: 'puzzle'")
        proofs[i].puzzle = this.web3.utils.asciiToHex(auths[i].puzzle)
      } else {
        proofs[i].puzzle = "0x0000000000000000000000000000000000000000000000000000000000000000"
      }

      // remove the "senders" array and the "cid" attribute from the token
      let body = Object.assign({}, locks[i].body)
      delete body.senders
      delete body.cid

      bodies.push(body)
      value = value.add(new this.web3.utils.BN(locks[i].body.value))
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
    console.log("bodies", bodies)
    let tx = await this.methods(domain.verifyingContract).unlock(bodies, proofs).send(o)
    return tx
  }
}
module.exports = Lock
