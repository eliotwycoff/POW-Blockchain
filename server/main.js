import { Meteor } from 'meteor/meteor';
import { BlocksCollection } from '/imports/db/BlocksCollection';
import { StatesCollection } from '/imports/db/StatesCollection';
import { FundsCollection } from '/imports/db/FundsCollection';
import { Jobs } from 'meteor/msavin:sjobs';
import Block from '/imports/models/Block.js';
import DEFAULT from '/imports/api/statesMethods.js';
import '/imports/api/statesPublications.js';
import '/imports/api/blocksMethods.js';
import '/imports/api/blocksPublications.js';
import '/imports/api/fundsMethods.js';
import '/imports/api/fundsPublications.js';
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const HASH_ATTEMPTS_PER_JOB = 10000;
const TARGET_SECONDS_PER_BLOCK = 20;
const INITIAL_COINBASE_REWARD = 50;

const mineBlock = (attempts, difficulty, coinbaseReward, minerPublicKey, genesisTimestamp) => {
    // Get the previous block from Mini Mongo.
    const previousBlock = BlocksCollection.findOne({}, {
        sort: { minedAt: -1 }
    });

    // Initialize a new block.
    const index = BlocksCollection.find({}).count() + 1;
    const previousBlockHash = previousBlock ? previousBlock.hash : '';
    const newBlock = new Block(index, previousBlockHash, difficulty);

    // Create the coinbase transaction. By convention it will be the first in the transactions array.
    newBlock.transactions[0] = {
        fundsSent: [],
        fundsReceived: [
            {
                ownerPublicKey: minerPublicKey,
                amount: coinbaseReward
            }
        ]
    };

    // To-do: verify and attach pending transactions in the mempool.

    // Begin searching for the golden hash.
    newBlock.generateHash();

    // Since this app is single threaded, if we do an infinite loop here,
    // it will hog up server resources and make the website unresponsive.
    // Thus, we only allow "attempts" number of attempts to find a block
    // so that other requests have a chance to get processed in between.
    while (!newBlock.isValid() && newBlock.nonce < attempts) {
        newBlock.nonce += 1;
        newBlock.generateHash();
    }

    let timeElapsed = 0;

    // Save the new block to the blockchain if it's valid,
    // and update the funds (UTXOs) set.
    if (newBlock.isValid()) {
        const startedAt = previousBlock ? previousBlock.minedAt : genesisTimestamp;
        timeElapsed = (newBlock.minedAt - startedAt) / 1000;
        newBlock.commitToBlockchain(timeElapsed);

        for (let i = 0; i < newBlock.transactions.length; i++) {
            // Mark spent funds as spent.
            for (let j = 0; j < newBlock.transactions[i].fundsSent.length; j++) {
                // under construction
            }

            // Add the newly created funds to the funds collection.
            for (let j = 0; j < newBlock.transactions[i].fundsReceived.length; j++) {
                FundsCollection.insert({
                    blockIndex: newBlock.index,
                    transactionIndex: i,
                    ownerPublicKey: newBlock.transactions[i].fundsReceived[j].ownerPublicKey,
                    amount: newBlock.transactions[i].fundsReceived[j].amount,
                    spent: false
                });
            }
        }
    }

    return { newBlock, timeElapsed };
};

Meteor.startup(() => {
    // Create a state document if it doesn't already exist,
    // and make sure the "mining" property is set to false.
    let state = StatesCollection.findOne({});
    
    if (!state) {
        // Create a public-private key pair for this miner.
        const key = ec.genKeyPair();

        console.log('***---------------------------------------------------------------------***');
        console.log('The server has generated a private key for your mining operations:');
        console.log(key.getPrivate().toString(16));
        console.log('Your private key is not stored on this machine and will not be shown again.');
        console.log('Please keep it safe.')
        console.log('Your public keys are stored in the state document in Mini Mongo.');
        console.log('***---------------------------------------------------------------------***');
          
        state = {
            mining: false,
            attempts: 0,
            difficulty: DEFAULT.DIFFICULTY,
            targetSecondsPerBlock: TARGET_SECONDS_PER_BLOCK,
            genesisTimestamp: 0,
            coinbaseReward: INITIAL_COINBASE_REWARD,
            minerPublicKey: {
                x: key.getPublic().x.toString(16),
                y: key.getPublic().y.toString(16)
            }
        };

        StatesCollection.insert(state);
    } else {
        state.mining = false;
        StatesCollection.update(state._id, {
            $set: { mining: false }
        });
    }

    // Clear out any residual jobs from the queue, and register a new mining job.
    Jobs.clear();
    Jobs.register({ // register the first mining job
        'miningLoop': function () {
            state = StatesCollection.findOne({});
            let genesisTimestamp = state.genesisTimestamp ? state.genesisTimestamp : Date.now();

            // Run the mining function.
            let { newBlock, timeElapsed } = mineBlock(
                HASH_ATTEMPTS_PER_JOB, 
                state.difficulty, 
                state.coinbaseReward, 
                state.minerPublicKey,
                genesisTimestamp);

            // Update the difficulty.
            let mismatch = timeElapsed > 0 ? timeElapsed / state.targetSecondsPerBlock : null;
            let newHexDifficulty = state.difficulty;

            if (mismatch) {
                let adjustmentRatio = Math.sign(mismatch - 1)*0.05 + 1;
                let newDecimalDifficulty = Number(`0x${state.difficulty}`)*adjustmentRatio;
                newHexDifficulty = Math.round(newDecimalDifficulty).toString(16).padStart(10, '0');
            }

            this.replicate(); // reschedule the job to begin immediately
            this.remove(); // remove this (completed) job from the queue

            // Update the state.
            StatesCollection.update(state._id, {
                $set: { 
                    attempts: newBlock.isValid() ? 0 : state.attempts + newBlock.nonce,
                    difficulty: newHexDifficulty,
                    genesisTimestamp: genesisTimestamp
                }
            });
        }
    });
    Jobs.run('miningLoop');
    Jobs.stop('miningLoop'); 
});

