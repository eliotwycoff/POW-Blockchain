import React from 'react';

export const Block = ({ block }) => {
    return (
        <li className="block animate__animated animate__bounceIn">
            <span>#{ block.index }&nbsp;&mdash;&nbsp;{ (new Date(block.minedAt)).toLocaleString(
                'en-US', 
                { hour: 'numeric', minute: 'numeric', second: 'numeric' }) }
                &nbsp;({ block.seconds } seconds)
                &nbsp;&mdash;&nbsp;{ block.nonce } (nonce)
                &nbsp;&mdash;&nbsp;0x{ block.difficulty }... (difficulty)</span>
            <span><strong>Hash: </strong> 0x{ block.hash }</span> 
        </li>
    );
};