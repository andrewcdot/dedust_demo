import { Address, TonClient4, WalletContractV3R2 } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";
import { Asset, Factory, MAINNET_FACTORY_ADDR } from "@dedust/sdk";

import * as dotenv from 'dotenv';

async function main() {
    dotenv.config();

    if (!process.env.MNEMONIC) {
        throw new Error("Environment variable MNEMONIC is required.");
    }

    const mnemonic = process.env.MNEMONIC.split(" ");


    const tonClient = new TonClient4({
        endpoint: "https://mainnet-v4.tonhubapi.com",
    });

    const factory = tonClient.open(
        Factory.createFromAddress(MAINNET_FACTORY_ADDR),
    );

    const keys = await mnemonicToPrivateKey(mnemonic);
    const wallet = tonClient.open(
        WalletContractV3R2.create({
            workchain: 0,
            publicKey: keys.publicKey,
        }),
    );

    const sender = wallet.sender(keys.secretKey);

    console.info(sender)
}

main();