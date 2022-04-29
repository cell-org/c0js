require('dotenv').config()
const C0 = require("../index")
const { expect } = require('chai')
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const Nebulus = require('nebulus')
const sigUtil = require('@metamask/eth-sig-util')
const web3 = createAlchemyWeb3(process.env.RINKEBY_URL)
var c0
const NAME = "test";
//const NAME = "NAME";
const SYMBOL = "SYMBOL";
const CHAINID = 4
const nebulus = new Nebulus();
var Token
var Collection
describe("c0.lock", () => {
  beforeEach(async () => {
    c0 = new C0()
    await c0.init({ web3, key: process.env.RINKEBY_PRIVATE_KEY })
  })
  it('cid field is required', async () => {
    try {
      let lock = await c0.lock.create({
        body: {},
        domain: {}
      })
    } catch (e) {
      expect(e.message).to.equal("required field: cid")
    }
  })
  it('lock() default attributes', async () => {
    let cid = await c0.util.cid("demo string")
    let meta_cid = await c0.util.cid({ name: "demo", description: "demo example", image: "ipfs://" + cid })
    let lock = await c0.lock.create({
      body: {
        cid: meta_cid,
        receiver: c0.account
      },
      domain: {}
    })
    //  lock := {
    //    cid,
    //    id,
    //    value,
    //    start,
    //    end,
    //    raw,
    //    sender,
    //    receiver,
    //    senders,
    //    merkleHash,
    //    puzzleHash
    //  }
    console.log("lock", lock)
    expect(lock.body.cid).to.exist
    expect(lock.body.cid).to.equal(meta_cid)
    expect(lock.body.id).to.exist
    expect(lock.body.value).to.exist
    expect(lock.body.start).to.exist
    expect(lock.body.end).to.exist
    expect(lock.body.raw).to.exist
    expect(lock.body.sender).to.exist
    expect(lock.body.receiver).to.exist
    expect(lock.body.receiver).to.equal(c0.account)
    expect(lock.body.senders).to.exist
    expect(lock.body.merkleHash).to.exist
    expect(lock.body.puzzleHash).to.exist
  })
})
