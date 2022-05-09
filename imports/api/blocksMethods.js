import { Meteor } from 'meteor/meteor';
import { BlocksCollection } from '../db/BlocksCollection';
import { StatesCollection } from '../db/StatesCollection';

Meteor.methods({
    'blocks.reset'() {
        const state = StatesCollection.findOne({});

        if (!state.mining) {
            BlocksCollection.remove({});
        }
    }
});