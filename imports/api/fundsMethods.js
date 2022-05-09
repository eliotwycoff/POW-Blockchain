import { Meteor } from 'meteor/meteor';
import { FundsCollection } from '../db/FundsCollection';
import { StatesCollection } from '../db/StatesCollection';

Meteor.methods({
    'funds.resetFunds'() {
        const state = StatesCollection.findOne({});

        if (!state.mining) {
            FundsCollection.remove({});
        }
    }
});