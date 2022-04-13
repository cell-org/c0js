/*************************************************************************
*
* const merkle = new Merkle({
*   web3: web3,
*   types: ["address", "uint32"],
*   values: [
*     ["0x1ad91ee08f21be3de0ba2ba6918e714da6b45836", 42],
*     ["0x1ad91ee08f21be3de0ba2ba6918e714da6b45836", 69]
*   ]
* ])
* let root = merkle.root()
* let proof = merkle.proof(["0x1ad91ee08f21be3de0ba2ba6918e714da6b45836", 69])
* let isvalid = merkle.verify(["0x1ad91ee08f21be3de0ba2ba6918e714da6b45836", 42], proof)
* ...
*
*************************************************************************/
const { MerkleTree } = require('merkletreejs')
class Merkle {
  constructor(o) {
    this.web3 = o.web3
    this.types = o.types
    this.leaves = o.values
    this.hashes = this.leaves.map((leaf) => {
      return this.hash(leaf)
    })
    this.tree = new MerkleTree(this.hashes, this.web3.utils.sha3, { sortPairs: true })
  }
  hash(values) {
    let args = values.map((value, i) => {
      return {
        t: this.types[i],
        v: value
      }
    })
    return Buffer.from(this.web3.utils.soliditySha3(...args).slice(2), 'hex')
  }
  root() {
    return this.tree.getHexRoot()
  }
  proof(values) {
    return this.tree.getHexProof(this.hash(values))
  }
  verify(leaf, proof) {
    return this.tree.verify(proof, this.hash(leaf), this.root())
  }
}
module.exports = Merkle
