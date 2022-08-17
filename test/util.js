require('dotenv').config()
const C0 = require("../index")
const { Blob } = require('buffer')
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
const domain = {
  "address": "0x93f4f1e0dca38dd0d35305d57c601f829ee53b51",
  "chainId": 4,
  "name": "_test_"
}
describe("util", () => {
  beforeEach(async () => {
    c0 = new C0()
    await c0.init({ web3, key: process.env.RINKEBY_PRIVATE_KEY })
    svg_cid = await c0.util.cid(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!-- Font Awesome Free 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) --><path d="M528 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h480c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-352 96c35.3 0 64 28.7 64 64s-28.7 64-64 64-64-28.7-64-64 28.7-64 64-64zm112 236.8c0 10.6-10 19.2-22.4 19.2H86.4C74 384 64 375.4 64 364.8v-19.2c0-31.8 30.1-57.6 67.2-57.6h5c12.3 5.1 25.7 8 39.8 8s27.6-2.9 39.8-8h5c37.1 0 67.2 25.8 67.2 57.6v19.2zM512 312c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16zm0-64c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16zm0-64c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16z"/></svg>`)
  })
  describe("util.solve()", () => {
    it("util.solve() for locally solving the hash puzzle", async () => {
      // domain description input is made up of : address, chainId, and name
      // but the output should be : verifyingContract, chainId, name, and version
      let meta_cid = await c0.util.cid({
        name: "test",
      })
      let token = await c0.token.create({
        domain,
        body: {
          cid: meta_cid,
          puzzle: "super secret passcode"
        }
      })

      let isvalid = c0.util.solve(token.body, {
        puzzle: "wrong code"
      })
      expect(isvalid).to.equal(false)

      let isvalid2 = c0.util.solve(token.body, {
        puzzle: "super secret passcode"
      })
      expect(isvalid2).to.equal(true)

    })
  })
  describe("util.cid()", async () => {
    it('cid Uint8Array', async () => {
      const buf = Buffer.from("hello world")
      const uintarray = Uint8Array.from(buf)

      let bufferCid = await c0.util.cid(buf)
      let uintarrayCid = await c0.util.cid(uintarray)
      expect(bufferCid).to.equal(uintarrayCid)
    })
    it('cid Arraybuffer', async () => {
      const buf = Buffer.from("hello world")
      const uintarray = Uint8Array.from(buf)
      const arraybuf = uintarray.buffer

      let bufferCid = await c0.util.cid(buf)
      let arraybufCid = await c0.util.cid(arraybuf)
      expect(bufferCid).to.equal(arraybufCid)
    })
    it('cid Blob', async () => {
      const buf = Buffer.from("hello world")
      const blob = new Blob([buf])

      let bufferCid = await c0.util.cid(buf)
      let blobCid = await c0.util.cid(blob)
      expect(bufferCid).to.equal(blobCid)
    })
    it('cid string', async () => {
      const buf = Buffer.from("hello world")
      let strCid = await c0.util.cid("hello world")
      let bufferCid = await c0.util.cid(buf)
      expect(strCid).to.equal(bufferCid)
    })
    it('cid object should be deterministic regardless of the structure', async () => {
      
      // util.cid will return identical results regardless of the structure, as long as the contents are the same
      let jsonCid = await c0.util.cid({
        name: "hello",
        description: "world"
      })
      let jsonCid2 = await c0.util.cid({
        description: "world",
        name: "hello"
      })
      expect(jsonCid).to.equal(jsonCid2)

      // demonstrate that using a normal JSON.stringify() won't produce deterministic results
      jsonCid = await c0.util.cid(JSON.stringify({
        name: "hello",
        description: "world"
      }))
      jsonCid2 = await c0.util.cid(JSON.stringify({
        description: "world",
        name: "hello"
      }))
      expect(jsonCid).to.not.equal(jsonCid2)
    })
    it('invalid types should throw an error', async () => {
      try {
        let intCid = await c0.util.cid(123)
      } catch (e) {
        expect(e.message).to.equal("argument must be Uint8Array, ArrayBuffer, Blob, Buffer, Stream, string, or JSON")
      }
    })
  })
  describe("util.verify()", () => {
    it("util.verify() requires id, cid, raw to exist", async () => {
      let meta_cid = await c0.util.cid({ name: "test", })
      let token = await c0.token.create({
        domain,
        body: {
          cid: meta_cid,
          puzzle: "super secret passcode"
        }
      })
      let isvalid = c0.util.verify(token.body)
      expect(isvalid).to.equal(true)

      delete token.body.cid
      isvalid = c0.util.verify(token.body)
      expect(isvalid).to.equal(false)


    })
  })
  describe("util.itoc(id, encoding)", () => {
    it("correctly transforms id to CID (with encoding 0)", async () => {
      const id = "66873793171800248244516196649613231247736404523076502481759488587065083018901"
      const expectedCid = "bafkreiet3e44dbwcebeipbye56gy4m3ipssjbmarrz5sz4mfiowmeo56su"
      let cid = c0.util.itoc(id)
      expect(cid).to.equal(expectedCid)
    })
  })
  describe("util.ctoi()", () => {
    it("correctly transforms cid into (id, encogding) pair", async () => {
      const cid = "bafkreiet3e44dbwcebeipbye56gy4m3ipssjbmarrz5sz4mfiowmeo56su"
      let { id, encoding } = c0.util.ctoi(cid)
      const expectedId = "66873793171800248244516196649613231247736404523076502481759488587065083018901"
      const expectedEncoding = 0
      expect(id).to.equal(expectedId)
      expect(encoding).to.equal(expectedEncoding)
    })
  })
})
