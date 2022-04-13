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
describe("c0.token.gift()", () => {
  beforeEach(async () => {
    c0 = new C0()
    await c0.init({ web3, key: process.env.RINKEBY_PRIVATE_KEY })
  })
  it('cid and receiver fields are required', async () => {
    let cid = await c0.util.cid("demo string")
    let meta_cid = await c0.util.cid({ name: "demo", description: "demo example", image: "ipfs://" + cid })
    try {
      let gift = await c0.token.gift({
        cid: meta_cid
      })
    } catch (e) {
      expect(e.message).to.equal("required field: receiver")
    }

    try {
      let gift = await c0.token.gift({ })
    } catch (e) {
      expect(e.message).to.equal("required field: cid")
    }
  })
  it('gift() default attributes', async () => {
    let cid = await c0.util.cid("demo string")
    let meta_cid = await c0.util.cid({ name: "demo", description: "demo example", image: "ipfs://" + cid })
    let gift = await c0.token.gift({
      cid: meta_cid,
      receiver: c0.account
    })
    expect(gift.cid).to.exist
    expect(gift.id).to.exist
    expect(gift.raw).to.exist
    expect(gift.receiver).to.exist
    expect(gift.royaltyReceiver).to.exist
    expect(gift.royaltyAmount).to.exist

    expect(gift.cid).to.equal(meta_cid)
    expect(gift.receiver).to.equal(c0.account)
    expect(gift.royaltyReceiver).to.equal("0x0000000000000000000000000000000000000000")
    expect(gift.royaltyAmount).to.equal("0")
  })
})
