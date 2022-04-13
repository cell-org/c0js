require('dotenv').config()
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3(process.env.RINKEBY_URL)
const F1 = require('../../index')
const f1 = new F1();
(async () => {
  await f1.init({
    web3,
    chainId: 4,
    key: process.env.KEY
  })
  let token = await f1.create({
    name: "test",
    symbol: "TEST"
  })
  let collections = await f1.collections()
  let addr = collections[collections.length-1]
  console.log(addr)
})();
