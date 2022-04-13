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
describe("c0.token.sign()", () => {
  beforeEach(async () => {
    c0 = new C0()
    await c0.init({ web3, key: process.env.RINKEBY_PRIVATE_KEY })
  })
  it('trying to sign() an already signed token should just overwrite the signature', async () => {
    let cid = await c0.util.cid("demo string")
    let meta_cid = await c0.util.cid({ name: "demo", description: "demo example", image: "ipfs://" + cid })
    const domain = {
      "address": "0x93f4f1e0dca38dd0d35305d57c601f829ee53b51",
      "chainId": 4,
      "name": "_test_"
    }
    let signedToken = await c0.token.create({
      domain: domain,
      body: {
        cid: meta_cid
      }
    })
    let signedToken2 = await c0.token.sign(signedToken)
    expect(signedToken).to.deep.equal(signedToken2)
  })
  it('sign() should create a token.body.signature attribute', async () => {
    let cid = await c0.util.cid("demo string")
    let meta_cid = await c0.util.cid({ name: "demo", description: "demo example", image: "ipfs://" + cid })
    const domain = {
      "address": "0x93f4f1e0dca38dd0d35305d57c601f829ee53b51",
      "chainId": 4,
      "name": "_test_"
    }
    let unsignedToken = await c0.token.build({
      domain: domain,
      body: {
        cid: meta_cid
      }
    })
    let signedToken = await c0.token.sign(unsignedToken)

    expect(signedToken.domain).to.deep.equal(unsignedToken.domain)
    expect(signedToken.body.signature).to.exist

    delete signedToken.body.signature
    expect(signedToken.body).to.deep.equal(unsignedToken.body)


  })
})
