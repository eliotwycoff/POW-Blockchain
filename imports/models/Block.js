import { BlocksCollection } from '/imports/db/BlocksCollection';
const SHA256 = require('crypto-js/sha256');

class Block {
    constructor(index, previousBlockHash, difficulty) {
        // properties to be included in the hash
        this.index = index;
        this.previousBlockHash = previousBlockHash;
        this.difficulty = difficulty;
        this.minedAt = Date.now();
        this.nonce = 0;
        this.transactions = [];

        // properties to be excluded from the hash
        this.hash = '';
    }

    generateHash() {
        this.hash = SHA256(JSON.stringify({
            index: this.index,
            previousBlockHash: this.previousBlockHash,
            difficulty: this.difficulty,
            minedAt: this.minedAt,
            nonce: this.nonce,
            transactions: this.transactions
        })).toString();
    }

    isValid() {
        return BigInt(`0x${this.hash.slice(0,10)}`) <= BigInt(`0x${this.difficulty}`);
    }

    commitToBlockchain(timeElapsed) {
        BlocksCollection.insert({
            index: this.index,
            previousBlockHash: this.previousBlockHash,
            difficulty: this.difficulty,
            minedAt: this.minedAt,
            nonce: this.nonce,
            transactions: this.transactions,
            hash: this.hash,
            seconds: timeElapsed
        });
    }
}

module.exports = Block;