import { Meteor } from 'meteor/meteor';
import { FundsCollection } from '../db/FundsCollection';

Meteor.publish('funds', function publishFunds() {
    return FundsCollection.find({ spent: false });
});