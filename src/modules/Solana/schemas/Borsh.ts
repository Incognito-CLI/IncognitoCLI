import { PublicKey } from '@solana/web3.js';
import basex from 'base-x';
import { BinaryReader, BinaryWriter } from 'borsh';

export type StringPublicKey = string;

const Alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export const extendBorsh = () => {
    (BinaryReader.prototype as any).readPubkey = function () {
        const reader = this as unknown as BinaryReader;
        const array = reader.readFixedArray(32);
        return new PublicKey(array);
    };

    (BinaryWriter.prototype as any).writePubkey = function (value: PublicKey) {
        const writer = this as unknown as BinaryWriter;
        writer.writeFixedArray(value.toBuffer());
    };

    (BinaryReader.prototype as any).readPubkeyAsString = function () {
        const reader = this as unknown as BinaryReader;
        const array = reader.readFixedArray(32);
        return basex(Alphabet).encode(array) as StringPublicKey;
    };

    (BinaryWriter.prototype as any).writePubkeyAsString = function (
        value: StringPublicKey
    ) {
        const writer = this as unknown as BinaryWriter;
        writer.writeFixedArray(basex(Alphabet).decode(value));
    };
};