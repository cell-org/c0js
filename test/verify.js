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
const domain = {
  "address": "0x93f4f1e0dca38dd0d35305d57c601f829ee53b51",
  "chainId": 4,
  "name": "_test_"
}
describe("c0.util.verify()", () => {
  beforeEach(async () => {
    c0 = new C0()
    await c0.init({ web3, key: process.env.RINKEBY_PRIVATE_KEY })
  })
  it('verify a valid gift', async () => {
    let cid = await c0.util.cid("demo string")
    let meta_cid = await c0.util.cid({ name: "demo", description: "demo example", image: "ipfs://" + cid })
    let gift = await c0.token.gift({
      cid: meta_cid,
      receiver: c0.account
    })
    let isvalid = c0.util.verify(gift)
    expect(isvalid).to.be.true
  })
  it('verify an invalid gift: wrong "raw" attribute', async () => {
    let cid = await c0.util.cid("demo string")
    let meta_cid = await c0.util.cid({ name: "demo", description: "demo example", image: "ipfs://" + cid })
    let gift = await c0.token.gift({
      cid: meta_cid,
      receiver: c0.account
    })
    // modify gift's "raw" attribute
    gift.raw = false
    let isvalid = c0.util.verify(gift)
    expect(isvalid).to.be.false
  })
  it('verify an invalid gift: wrong "cid" attribute', async () => {
    let cid = await c0.util.cid("demo string")
    let meta_cid = await c0.util.cid({ name: "demo", description: "demo example", image: "ipfs://" + cid })
    let gift = await c0.token.gift({
      cid: meta_cid,
      receiver: c0.account
    })
    // modify gift's "raw" attribute
    gift.cid = "bafkreiecoogmguhvhvslpait4kknvmic5344dgvrs3l5migok5aj33pcei"
    let isvalid = c0.util.verify(gift)
    expect(isvalid).to.be.false
  })
  it('verify a valid unsigned token', async () => {
    let cid = await c0.util.cid("demo string")
    let meta_cid = await c0.util.cid({ name: "demo", description: "demo example", image: "ipfs://" + cid })
    let token = await c0.token.build({
      domain,
      body: {
        cid: meta_cid,
      }
    })
    let isvalid = c0.util.verify(token.body)
    expect(isvalid).to.be.true
  })
  it('verify an invalid unsigned token: wrong "raw" attribute', async () => {
    let cid = await c0.util.cid("demo string")
    let meta_cid = await c0.util.cid({ name: "demo", description: "demo example", image: "ipfs://" + cid })
    let token = await c0.token.build({
      domain,
      body: {
        cid: meta_cid,
      }
    })
    // modify gift's "raw" attribute
    token.body.raw = false
    let isvalid = c0.util.verify(token.body)
    expect(isvalid).to.be.false
  })
  it('verify an invalid unsigned token: wrong "cid" attribute', async () => {
    let cid = await c0.util.cid("demo string")
    let meta_cid = await c0.util.cid({ name: "demo", description: "demo example", image: "ipfs://" + cid })
    let token = await c0.token.build({
      domain,
      body: {
        cid: meta_cid,
      }
    })
    // modify gift's "raw" attribute
    token.body.cid = "bafkreiecoogmguhvhvslpait4kknvmic5344dgvrs3l5migok5aj33pcei"
    let isvalid = c0.util.verify(token.body)
    expect(isvalid).to.be.false
  })
  it('verify a valid signed token', async () => {
    let cid = await c0.util.cid("demo string")
    let meta_cid = await c0.util.cid({ name: "demo", description: "demo example", image: "ipfs://" + cid })
    let token = await c0.token.create({
      domain,
      body: {
        cid: meta_cid,
      }
    })
    let isvalid = c0.util.verify(token.body)
    expect(isvalid).to.be.true
  })
  it('verify an invalid signed token: wrong "raw" attribute', async () => {
    let cid = await c0.util.cid("demo string")
    let meta_cid = await c0.util.cid({ name: "demo", description: "demo example", image: "ipfs://" + cid })
    let token = await c0.token.create({
      domain,
      body: {
        cid: meta_cid,
      }
    })
    // modify gift's "raw" attribute
    token.body.raw = false
    let isvalid = c0.util.verify(token.body)
    expect(isvalid).to.be.false
  })
  it('verify an invalid signed token: wrong "cid" attribute', async () => {
    let cid = await c0.util.cid("demo string")
    let meta_cid = await c0.util.cid({ name: "demo", description: "demo example", image: "ipfs://" + cid })
    let token = await c0.token.create({
      domain,
      body: {
        cid: meta_cid,
      }
    })
    // modify gift's "raw" attribute
    token.body.cid = "bafkreiecoogmguhvhvslpait4kknvmic5344dgvrs3l5migok5aj33pcei"
    let isvalid = c0.util.verify(token.body)
    expect(isvalid).to.be.false
  })
})
