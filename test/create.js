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
describe("c0.token.create()", () => {
  beforeEach(async () => {
    c0 = new C0()
    await c0.init({ web3, key: process.env.RINKEBY_PRIVATE_KEY })
  })
  it('build() and create() should produce identical result except for token.body.signature', async () => {
    let svg_cid = await c0.util.cid(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!-- Font Awesome Free 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) --><path d="M528 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h480c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-352 96c35.3 0 64 28.7 64 64s-28.7 64-64 64-64-28.7-64-64 28.7-64 64-64zm112 236.8c0 10.6-10 19.2-22.4 19.2H86.4C74 384 64 375.4 64 364.8v-19.2c0-31.8 30.1-57.6 67.2-57.6h5c12.3 5.1 25.7 8 39.8 8s27.6-2.9 39.8-8h5c37.1 0 67.2 25.8 67.2 57.6v19.2zM512 312c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16zm0-64c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16zm0-64c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16z"/></svg>`)
    let meta_cid = await c0.util.cid({
      name: "svg",
      description: "svg example",
      image: "ipfs://" + svg_cid
    })
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
    let unsignedToken = await c0.token.build({
      domain: domain,
      body: {
        cid: meta_cid
      }
    })

    // signedToken and unsignedToken are different
    expect(signedToken).to.not.deep.equal(unsignedToken)

    // remove the signature from the signedToken and it should be identical to the unsignedToken
    delete signedToken.body.signature
    expect(signedToken).to.deep.equal(unsignedToken)
  })
  it("should include all attributes", async () => {
    let svg_cid = await c0.util.cid(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!-- Font Awesome Free 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) --><path d="M528 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h480c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-352 96c35.3 0 64 28.7 64 64s-28.7 64-64 64-64-28.7-64-64 28.7-64 64-64zm112 236.8c0 10.6-10 19.2-22.4 19.2H86.4C74 384 64 375.4 64 364.8v-19.2c0-31.8 30.1-57.6 67.2-57.6h5c12.3 5.1 25.7 8 39.8 8s27.6-2.9 39.8-8h5c37.1 0 67.2 25.8 67.2 57.6v19.2zM512 312c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16zm0-64c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16zm0-64c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16z"/></svg>`)
    let meta_cid = await c0.util.cid({
      name: "svg",
      description: "svg example",
      image: "ipfs://" + svg_cid
    })
    const domain = {
      "address": "0x93f4f1e0dca38dd0d35305d57c601f829ee53b51",
      "chainId": 4,
      "name": "_test_"
    }
    const expectedDomain = {
      "verifyingContract": "0x93f4f1e0dca38dd0d35305d57c601f829ee53b51",
      "chainId": 4,
      "name": "_test_",
      "version": "1"
    }
    let token = await c0.token.create({
      domain: domain,
      body: {
        cid: meta_cid
      }
    })

    // Top level attributes must exist
    expect(token.body).to.exist
    expect(token.domain).to.exist
    expect(token.domain).to.deep.equal(expectedDomain)

    // Check the body attributes
    expect(token.body.cid).to.exist
    expect(token.body.id).to.exist
    expect(token.body.encoding).to.exist
    expect(token.body.sender).to.exist
    expect(token.body.value).to.exist
    expect(token.body.start).to.exist
    expect(token.body.end).to.exist
    expect(token.body.royaltyReceiver).to.exist
    expect(token.body.royaltyAmount).to.exist
    expect(token.body.senders).to.exist
    expect(token.body.merkleHash).to.exist
    expect(token.body.puzzleHash).to.exist

    // check that the signature exists
    expect(token.body.signature).to.exist
     
  })
  it("default attributes", async () => {
    let svg_cid = await c0.util.cid(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!-- Font Awesome Free 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) --><path d="M528 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h480c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-352 96c35.3 0 64 28.7 64 64s-28.7 64-64 64-64-28.7-64-64 28.7-64 64-64zm112 236.8c0 10.6-10 19.2-22.4 19.2H86.4C74 384 64 375.4 64 364.8v-19.2c0-31.8 30.1-57.6 67.2-57.6h5c12.3 5.1 25.7 8 39.8 8s27.6-2.9 39.8-8h5c37.1 0 67.2 25.8 67.2 57.6v19.2zM512 312c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16zm0-64c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16zm0-64c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16z"/></svg>`)
    let meta_cid = await c0.util.cid({
      name: "svg",
      description: "svg example",
      image: "ipfs://" + svg_cid
    })
    const domain = {
      "address": "0x93f4f1e0dca38dd0d35305d57c601f829ee53b51",
      "chainId": 4,
      "name": "_test_"
    }
    let token = await c0.token.create({
      domain: domain,
      body: {
        cid: meta_cid
      }
    })

    expect(token.body.cid).to.equal(meta_cid)
    expect(token.body.sender).to.equal("0x0000000000000000000000000000000000000000")
    expect(token.body.value).to.equal("0")
    expect(token.body.start).to.equal("0")
    expect(token.body.end).to.equal("18446744073709551615")
    expect(token.body.royaltyReceiver).to.equal("0x0000000000000000000000000000000000000000")
    expect(token.body.royaltyAmount).to.equal("0")
    expect(token.body.senders.length).to.equal(0)
    expect(token.body.merkleHash).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000")
    expect(token.body.puzzleHash).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000")

  })
})
