import { Meteor } from 'meteor/meteor';
import { Jobs } from 'meteor/msavin:sjobs';
import { StatesCollection } from '../db/StatesCollection';
import { check } from 'meteor/check';

const DEFAULT = {
    DIFFICULTY: '00000fffff' // use only the first 10 hex digits since javascript has trouble converting larger BigInts
}

Meteor.methods({
    'states.toggleMining'(miningState) {
        check(miningState, Boolean);
        const state = StatesCollection.findOne({});
        StatesCollection.update(state._id, {
            $set: { mining: miningState }
        });

        if (miningState) {
            Jobs.start('miningLoop');
        } else {
            Jobs.stop('miningLoop');
        }
    },
    'states.resetAttempts'() {
        const state = StatesCollection.findOne({});

        if (!state.mining) {
            StatesCollection.update(state._id, {
                $set: { attempts: 0 }
            });
        }
    },
    'states.resetDifficulty'(difficulty) {
        if (!difficulty) difficulty = DEFAULT.DIFFICULTY;
        check(difficulty, String);
        const state = StatesCollection.findOne({});

        if (!state.mining) {
            StatesCollection.update(state._id, {
                $set: { difficulty: difficulty }
            });
        }
    },
    'states.resetGenesisTimestamp'() {
        const state = StatesCollection.findOne({});

        if(!state.mining) {
            StatesCollection.update(state._id, {
                $set: { genesisTimestamp: 0 }
            });
        }
    }
});

module.exports = DEFAULT;