const stringify = require('json-stringify-deterministic')
const ipfsh = require('ipfsh')
const { CID } = require('multiformats/cid')
const { base32 } = require("multiformats/bases/base32")
const { create } = require('multiformats/hashes/digest');
class Util {
  init(o) {
    this.web3 = o.web3
  }
  stringify(o) {
    return stringify(o)
  }
  async cid(o) {
    let type = o.constructor.name;
    let r;
    if (type === 'Uint8Array') {
      r = await ipfsh.file(o)
    } else if (type === 'ArrayBuffer') {
      r = await ipfsh.file(new Uint8Array(o))
    } else if (type === "Blob") {
      let arrayBuf = await o.arrayBuffer()
      r = await ipfsh.file(new Uint8Array(arrayBuf))
    } else if (type === "Buffer") {
      r = await ipfsh.file(o)
    } else if (typeof o === 'object' && typeof o.pipe === 'function' && o.readable !== false && typeof o._read === "function" && typeof o._readableState === "object") {
      // readablestream
      r = await ipfsh.file(o)
    } else if (typeof o === 'string') {
      // string => convert to Uint8Array first
      r = await ipfsh.file(new TextEncoder().encode(o))
    } else if (typeof o === "object") {
      r = await ipfsh.file(new TextEncoder().encode(stringify(o)))
    } else {
      throw new Error("argument must be Uint8Array, ArrayBuffer, Blob, Buffer, Stream, string, or JSON")
    }
    return r
  }
  verify(body, verbose) {
    if (!body) {
      if (verbose) {
        throw new Error("body required")
      } else {
        return false
      }
    }
    if (!body.id) {
      if (verbose) {
        throw new Error("body.id required")
      } else {
        return false
      }
    }
    console.log(body.encoding)
    console.log(typeof body.encoding)
    if (typeof body.encoding === "undefined") {
      if (verbose) {
        throw new Error("body.encoding required")
      } else {
        return false
      }
    }
    if (!body.cid) {
      if (verbose) {
        throw new Error("body.cid required")
      } else {
        return false
      }
    }

    const code = (body.encoding === 0 ? 85 : 112);
    const multiHashCode = 18  // sha256
    const hexId = this.web3.utils.toHex(body.id)
    const padded = hexId.slice(2).padStart(64, '0')
    const d = Uint8Array.from(Buffer.from(padded, 'hex'));
    const digest = create(multiHashCode, d)
    const actualCid = CID.create(1, code, digest).toString()

    if (actualCid !== body.cid) {
      if (verbose) {
        throw new Error("the cid attribute and the id + encoding attributes don't match")
      } else {
        return false
      }
    }
    return true

  }
  solve(body, options) {
    if (!body.puzzleHash || body.puzzleHash === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      // if the body has a 0 puzzleHash success
      return true;
    } else {
      // if the body has a NON-0 puzzleHash, test
      if (options.puzzle) {
        let hash = this.web3.utils.soliditySha3(options.puzzle)
        return hash === body.puzzleHash
      } else {
        return false
      }
    }
  }
}
module.exports = Util
