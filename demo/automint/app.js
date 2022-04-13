require('dotenv').config()
const Web3 = require('web3')
const Nebulus = require('nebulus')
const F1 = require('../../index')
const web3 = new Web3()
const f1 = new F1();
const nebulus = new Nebulus();
(async () => {
  await f1.init({
    web3,
    chainId: 4,
    key: process.env.KEY
  })
  const cid = await nebulus.download("https://thisartworkdoesnotexist.com")
  console.log("cid before", cid)
  let collection = await f1.collection({
    address: "0xBB9cEaCBEb8302c31AA419c5dB05e12443BFa7a0",
    name: "test",
    chainId: 4
  })
  let token = await collection.create({
    cid
  })
  console.log("token", token)
  let c = f1.cid(token.body)
  console.log("cid after", c)
  let tokenId = f1.tokenId(token.body)
  console.log("tokenId", tokenId)
  let id = f1.id(token.body)
  console.log("id", id)
  let tokenURI = f1.tokenURI(token.body)
  console.log("tokenURI", tokenURI)
})();
