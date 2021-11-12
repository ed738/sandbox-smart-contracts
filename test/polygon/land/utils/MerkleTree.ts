import * as utils from 'ethereumjs-util-0.5';
import {Buffer as SafeBuffer} from 'safe-buffer';
import {keccak256} from 'ethereumjs-util-0.5';

const sha3 = keccak256;

export default class MerkleTree {
  leaves: any;
  layers: any;

  constructor(leaves = []) {
    if (leaves.length < 1) {
      throw new Error('Atleast 1 leaf needed');
    }

    const depth = Math.ceil(Math.log(leaves.length) / Math.log(2));
    if (depth > 20) {
      throw new Error('Depth must be 20 or less');
    }

    this.leaves = leaves.concat(
      Array.from(Array(Math.pow(2, depth) - leaves.length), () =>
        utils.zeros(32)
      )
    );
    this.layers = [this.leaves];
    this.createHashes(this.leaves);
  }

  createHashes(nodes) {
    if (nodes.length === 1) {
      return false;
    }

    const treeLevel = [];
    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      const right = nodes[i + 1];
      const data = SafeBuffer.concat([left, right]);
      treeLevel.push(sha3(data));
    }

    // is odd number of nodes
    if (nodes.length % 2 === 1) {
      treeLevel.push(nodes[nodes.length - 1]);
    }

    this.layers.push(treeLevel);
    this.createHashes(treeLevel);
  }

  getLeaves() {
    return this.leaves;
  }

  getLayers() {
    return this.layers;
  }

  getRoot() {
    return this.layers[this.layers.length - 1][0];
  }

  getProof(leaf) {
    let index = -1;
    for (let i = 0; i < this.leaves.length; i++) {
      if (SafeBuffer.compare(leaf, this.leaves[i]) === 0) {
        index = i;
      }
    }

    const proof = [];
    if (index <= this.getLeaves().length) {
      let siblingIndex;
      for (let i = 0; i < this.layers.length - 1; i++) {
        if (index % 2 === 0) {
          siblingIndex = index + 1;
        } else {
          siblingIndex = index - 1;
        }
        index = Math.floor(index / 2);
        proof.push(this.layers[i][siblingIndex]);
      }
    }
    return proof;
  }

  verify(value, index, root, proof) {
    if (!Array.isArray(proof) || !value || !root) {
      return false;
    }

    let hash = value;
    for (let i = 0; i < proof.length; i++) {
      const node = proof[i];
      if (index % 2 === 0) {
        hash = sha3(SafeBuffer.concat([hash, node]));
      } else {
        hash = sha3(SafeBuffer.concat([node, hash]));
      }

      index = Math.floor(index / 2);
    }

    return SafeBuffer.compare(hash, root) === 0;
  }
}

module.exports = MerkleTree;
