import React from 'react';

export const Account = ({ publicKeyX, publicKeyY, amount }) => {
    const amountKey = `${publicKeyX}${publicKeyY}${amount}`;
    return (
        <li className="account animate__animated animate__flash">
            <span>{ `(${publicKeyX.slice(0,25)}..., ${publicKeyY.slice(0,25)}...)` }&nbsp;</span>
            <span key={ amountKey } className="animate__animated animate__flash">{ amount } BTC</span>
        </li>
    );
};