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
describe("c0.gift", () => {
  beforeEach(async () => {
    c0 = new C0()
    await c0.init({ web3, key: process.env.RINKEBY_PRIVATE_KEY })
  })
  it('cid and receiver fields are required', async () => {
    let cid = await c0.util.cid("demo string")
    let meta_cid = await c0.util.cid({ name: "demo", description: "demo example", image: "ipfs://" + cid })
    try {
      let gift = await c0.gift.create({
        body: {
          cid: meta_cid
        },
        domain: {}
      })
    } catch (e) {
      expect(e.message).to.equal("required field: receiver")
    }

    try {
      let gift = await c0.gift.create({
        body: {},
        domain: {}
      })
    } catch (e) {
      expect(e.message).to.equal("required field: cid")
    }
  })
  it('gift() default attributes', async () => {
    let cid = await c0.util.cid("demo string")
    let meta_cid = await c0.util.cid({ name: "demo", description: "demo example", image: "ipfs://" + cid })
    let gift = await c0.gift.create({
      body: {
        cid: meta_cid,
        receiver: c0.account
      },
      domain: { }
    })
    expect(gift.body.cid).to.exist
    expect(gift.body.id).to.exist
    expect(gift.body.encoding).to.exist
    expect(gift.body.receiver).to.exist
    expect(gift.body.relations).to.deep.equal([])

    expect(gift.body.cid).to.equal(meta_cid)
    expect(gift.body.receiver).to.equal(c0.account)
  })
  it("royalty with gift", async () => {
    let cid = await c0.util.cid("demo string")
    let meta_cid = await c0.util.cid({ name: "demo", description: "demo example", image: "ipfs://" + cid })
    let gift = await c0.gift.create({
      body: {
        cid: meta_cid,
        receiver: c0.account,
        royalty: {
          what: 10 ** 5,
          where: "address"
        }
      },
      domain: { }
    })
    console.log(JSON.stringify(gift,null,2))
    expect(gift.body.cid).to.exist
    expect(gift.body.id).to.exist
    expect(gift.body.encoding).to.exist
    expect(gift.body.receiver).to.exist
    expect(gift.body.relations.length).to.equal(1)
    expect(gift.body.relations[0].code).to.equal(11)
    expect(gift.body.relations[0].addr).to.equal("address")
    expect(gift.body.relations[0].id).to.equal(10 ** 5)

    expect(gift.body.cid).to.equal(meta_cid)
    expect(gift.body.receiver).to.equal(c0.account)
  })
})
