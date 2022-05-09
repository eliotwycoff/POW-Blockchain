import React, { useState, Fragment } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { StatesCollection } from '/imports/db/StatesCollection';
import { BlocksCollection } from '/imports/db/BlocksCollection';
import { FundsCollection } from '/imports/db/FundsCollection';
import { Block } from './Block';
import { Account } from './Account';

export const App = () => {
  const { state, blocks, funds, isLoading } = useTracker(() => {
    const statesHandler = Meteor.subscribe('states');
    const blocksHandler = Meteor.subscribe('blocks');
    const fundsHandler = Meteor.subscribe('funds');
    if (!statesHandler.ready() || !blocksHandler.ready() || !fundsHandler.ready()) {
      return { state: {}, blocks: [], funds: [], isLoading: true };
    }
    return { 
      state: StatesCollection.findOne({}),
      blocks: BlocksCollection.find({}, {
        sort: { minedAt: -1 }
      }).fetch(),
      funds: FundsCollection.find({}).fetch(),
      isLoading: false };
  });

  let toggleMiningString = '';
  let toggleMining = null;
  let blocksString = '';
  let controlPanelString = '';
  let resetBlocksButtonClass = 'reset-blocks-inactive';
  let resetBlocks = null;
  let accounts = {};

  if (!isLoading) {
    toggleMiningString = state.mining ? 'Stop Mining' : 'Start Mining';
    toggleMining = () => {
      Meteor.call('states.toggleMining', !state.mining);
    };

    blocksString = `Blocks (${blocks.length})`;
    controlPanelString = `Mining Block #${blocks.length+1} (${state.mining ? 'Active' : 'Paused'})`;
    controlPanelString += `, Hash Attempts: ${Number(state.attempts).toLocaleString()}`;
    resetBlocksButtonClass = !state.mining ? 'reset-blocks-active' : resetBlocksButtonClass;

    // Calculate the balances of each account using the funds (UTXOs) passed from the server.
    for (let fund of funds) {
      const publicKeyPair = [fund.ownerPublicKey.x, fund.ownerPublicKey.y];
      if (!accounts.hasOwnProperty(publicKeyPair)) {
        accounts[publicKeyPair] = fund.amount;
      } else {
        accounts[publicKeyPair] += fund.amount;
      }
    }

    if (!state.mining) {
      resetBlocks = () => {
        Meteor.call('blocks.reset');
        Meteor.call('states.resetAttempts');
        Meteor.call('states.resetDifficulty');
        Meteor.call('states.resetGenesisTimestamp');
        Meteor.call('funds.resetFunds');
      };
    }
  }

  return (
    <Fragment>
      <header>
        <div className="container">
          <h3>Single-Node Demonstration</h3>
          <h1>Proof-of-Work Blockchain</h1>
        </div>
      </header>

      <section className="blocks">
        <div className="container">
          <div className="control-panel mining-controls">
            <h3 className="control-panel__title">{ controlPanelString }</h3>
            <div className="row">
              { !isLoading && <button className="toggle-mining" onClick={toggleMining}>{toggleMiningString}</button>}
              { !isLoading && <button className={resetBlocksButtonClass} onClick={resetBlocks}>Reset Blockchain</button> }
            </div>
            { !isLoading && 
              <div className="control-panel__parameters">
                <p><strong>Difficulty: </strong>block hashes must start with <span className="control-panel__difficulty animate__animated animate__flash" key={state.difficulty}>0x{state.difficulty}...</span> or less.</p>
                <p><strong>Target Duration: </strong>blocks should take {state.targetSecondsPerBlock} seconds on average.</p>
              </div> }
          </div>

          <div className="control-panel account-balances">
            <h3 className="control-panel__title">Account Balances</h3>
            <div className="control-panel__parameters">
              { !isLoading && <p><strong>Coinbase Reward: </strong>{ state.coinbaseReward } BTC</p> }
              { !isLoading && <p><strong>Accounts Addresses</strong> are (publicKeyX, publicKeyY) tuples:</p> }
            </div>
            <ul className="account-list">
              { !isLoading &&
                Object.entries(accounts).map(entry => <Account
                  key={ entry[0] } // equivalent to "publicKeyX,publicKeyY"
                  publicKeyX={ entry[0].split(',')[0] } // equivalent to "publicKeyX"
                  publicKeyY={ entry[0].split(',')[1] } // equivalent to "publicKeyY"
                  amount={ entry[1] }/>) 
              }
            </ul>
          </div>

          { !isLoading &&
          <div>
            <h2 className="blocks__title">{ blocksString }</h2>
            <ul className="block-list">
              {
                blocks.map(block => <Block 
                  key={ block._id }
                  block={ block }/>)
              }
            </ul>
          </div>
          }
        </div>
      </section>
    </Fragment>
  );
};