import { Meteor } from 'meteor/meteor';
import { BlocksCollection } from '../db/BlocksCollection';

Meteor.publish('blocks', function publishBlocks() {
    return BlocksCollection.find({});
});