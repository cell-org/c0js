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
var svg_cid;
const testDefaults = (token, exclude) => {
  // check only if NOT included in "exclude", 
  if (!exclude.includes("sender")) expect(token.body.sender).to.equal("0x0000000000000000000000000000000000000000")
  if (!exclude.includes("receiver")) expect(token.body.receiver).to.equal("0x0000000000000000000000000000000000000000")
  if (!exclude.includes("value")) expect(token.body.value).to.equal("0")
  if (!exclude.includes("start")) expect(token.body.start).to.equal("0")
  if (!exclude.includes("end")) expect(token.body.end).to.equal("18446744073709551615")
  if (!exclude.includes("royaltyReceiver")) expect(token.body.royaltyReceiver).to.equal("0x0000000000000000000000000000000000000000")
  if (!exclude.includes("royaltyAmount")) expect(token.body.royaltyAmount).to.equal("0")
  if (!exclude.includes("burned")) expect(token.body.burned.length).to.equal(0)
  if (!exclude.includes("owns")) expect(token.body.owns.length).to.equal(0)

  if (!exclude.includes("senders")) expect(token.body.senders.length).to.equal(0)
  if (!exclude.includes("merkleHash")) expect(token.body.merkleHash).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000")
  if (!exclude.includes("puzzleHash")) expect(token.body.puzzleHash).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000")
}
describe("c0.token.build()", () => {
  beforeEach(async () => {
    c0 = new C0()
    await c0.init({ web3, key: process.env.RINKEBY_PRIVATE_KEY })
    svg_cid = await c0.util.cid(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!-- Font Awesome Free 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) --><path d="M528 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h480c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-352 96c35.3 0 64 28.7 64 64s-28.7 64-64 64-64-28.7-64-64 28.7-64 64-64zm112 236.8c0 10.6-10 19.2-22.4 19.2H86.4C74 384 64 375.4 64 364.8v-19.2c0-31.8 30.1-57.6 67.2-57.6h5c12.3 5.1 25.7 8 39.8 8s27.6-2.9 39.8-8h5c37.1 0 67.2 25.8 67.2 57.6v19.2zM512 312c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16zm0-64c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16zm0-64c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16z"/></svg>`)
  })
  it("domain should include all attributes", async () => {
    // domain description input is made up of : address, chainId, and name
    // but the output should be : verifyingContract, chainId, name, and version
    const cid = await c0.util.cid("xxx")
    const domain = {
      "address": "0x93f4f1e0dca38dd0d35305d57c601f829ee53b51",
      "chainId": 4,
      "name": "_test_"
    }
    let meta_cid = await c0.util.cid({
      name: "test",
      description: "test example",
      image: "ipfs://" + cid
    })
    let token = await c0.token.build({
      domain: domain,
      body: {
        cid: meta_cid
      }
    })
    expect(token.domain.verifyingContract).to.exist
    expect(token.domain.chainId).to.exist
    expect(token.domain.name).to.exist
    expect(token.domain.version).to.exist

    expect(token.domain.verifyingContract).to.equal("0x93f4f1e0dca38dd0d35305d57c601f829ee53b51")
    expect(token.domain.chainId).to.equal(domain.chainId)
    expect(token.domain.name).to.equal(domain.name)
    expect(token.domain.version).to.equal("1")
    
  })
  it("body should include all attributes", async () => {
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
    let token = await c0.token.build({
      domain: domain,
      body: {
        cid: meta_cid
      }
    })
    const expectedDomain = {
      "verifyingContract": "0x93f4f1e0dca38dd0d35305d57c601f829ee53b51",
      "chainId": 4,
      "name": "_test_",
      "version": "1"
    }

    // Top level attributes must exist
    expect(token.body).to.exist
    expect(token.domain).to.exist
    expect(token.domain).to.deep.equal(expectedDomain)

    // Check the body attributes
    expect(token.body.cid).to.exist
    expect(token.body.id).to.exist
    expect(token.body.encoding).to.exist
    expect(token.body.sender).to.exist
    expect(token.body.receiver).to.exist
    expect(token.body.value).to.exist
    expect(token.body.start).to.exist
    expect(token.body.end).to.exist
    expect(token.body.royaltyReceiver).to.exist
    expect(token.body.royaltyAmount).to.exist
    expect(token.body.burned).to.exist
    expect(token.body.owns).to.exist
    expect(token.body.senders).to.exist
    expect(token.body.merkleHash).to.exist
    expect(token.body.puzzleHash).to.exist

    // check that the signature does NOT exist
    expect(token.body.signature).to.not.exist
     
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
    let token = await c0.token.build({
      domain: domain,
      body: {
        cid: meta_cid
      }
    })
    testDefaults(token, [])
  })
  it('sender', async () => {
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
    let token = await c0.token.build({
      domain: domain,
      body: {
        cid: meta_cid,
        sender: c0.account
      }
    })
    expect(token.body.cid).to.equal(meta_cid)
    expect(token.body.sender).to.equal(c0.account)
    testDefaults(token, ["sender"])
  })
  it('value', async () => {
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
    let token = await c0.token.build({
      domain: domain,
      body: {
        cid: meta_cid,
        value: 10**18
      }
    })
    expect(token.body.cid).to.equal(meta_cid)
    expect(token.body.value).to.equal("" + 10**18)
    testDefaults(token, ["value"])
  })
  it('start', async () => {
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
    const start = Math.floor(Date.now() / 1000) + 100000
    let token = await c0.token.build({
      domain: domain,
      body: {
        cid: meta_cid,
        start,
      }
    })
    expect(token.body.cid).to.equal(meta_cid)
    expect(token.body.start).to.equal("" + start)
    testDefaults(token, ["start"])
  })
  it('end', async () => {
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
    const end = Math.floor(Date.now() / 1000) + 100000
    let token = await c0.token.build({
      domain: domain,
      body: {
        cid: meta_cid,
        end: end
      }
    })
    expect(token.body.cid).to.equal(meta_cid)
    expect(token.body.end).to.equal("" + end)
    testDefaults(token, ["end"])
  })
  it('royalty', async () => {
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
    let token = await c0.token.build({
      domain: domain,
      body: {
        cid: meta_cid,
        royaltyAmount: 100000, // 10%
        royaltyReceiver: c0.account
      }
    })
    expect(token.body.royaltyAmount).to.equal("100000")
    expect(token.body.royaltyReceiver).to.equal(c0.account)
    testDefaults(token, ["end", "royaltyAmount", "royaltyReceiver"])
  })
  it('royalty with no royaltyAmount will create royaltyAmount of 0 by default', async () => {
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
    let token = await c0.token.build({
      domain: domain,
      body: {
        cid: meta_cid,
        royaltyReceiver: c0.account
      }
    })
    expect(token.body.royaltyAmount).to.equal("0")
    expect(token.body.royaltyReceiver).to.equal(c0.account)
    testDefaults(token, ["royaltyReceiver"])
  })
  it('royalty with no royaltyReceiver will create royaltyReceiver of 0x0 address by default', async () => {
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
    let token = await c0.token.build({
      domain: domain,
      body: {
        cid: meta_cid,
        royaltyAmount: 100000, // 10%
      }
    })
    expect(token.body.royaltyAmount).to.equal("100000")
    expect(token.body.royaltyReceiver).to.equal("0x0000000000000000000000000000000000000000")
    testDefaults(token, ["royaltyAmount"])
  })
  it('senders', async () => {
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
    let token = await c0.token.build({
      domain: domain,
      body: {
        cid: meta_cid,
        senders: [
          "0x93f4f1e0dca38dd0d35305d57c601f829ee53b51",
          c0.account
        ]
      }
    })
    expect(token.body.senders.length).to.equal(2)
    expect(token.body.merkleHash).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000")
    expect(token.body.senders).to.deep.equal([
      "0x93f4f1e0dca38dd0d35305d57c601f829ee53b51",
      c0.account
    ])
    testDefaults(token, ["senders", "merkleHash"])
  })
  it('puzzle', async () => {
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
    let token = await c0.token.build({
      domain: domain,
      body: {
        cid: meta_cid,
        puzzle: "this is the solution"
      }
    })
    testDefaults(token, ["puzzleHash"])
  })
})
