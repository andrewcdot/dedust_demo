import {Address, toNano, Sender, TonClient4, WalletContractV3R2, WalletContractV4} from "@ton/ton";
import {
    Asset,
    Factory,
    JettonRoot,
    MAINNET_FACTORY_ADDR,
    Pool,
    PoolType,
    VaultNative,
} from "@dedust/sdk";

import * as dotenv from 'dotenv';
import {mnemonicToPrivateKey} from "@ton/crypto";

dotenv.config();
const SCALE_ADDR = Address.parse(
    "EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE",
);

async function main() {
    dotenv.config();

    const tonClient = new TonClient4({
        endpoint: "https://mainnet-v4.tonhubapi.com",
    });

    /**
     * STEP 1. Find all necessary contracts.
     */
    if (!process.env.MNEMONIC) {
        throw new Error("Environment variable MNEMONIC is required.");
    }
    const mnemonic = process.env.MNEMONIC.split(" ");
    const keys = await mnemonicToPrivateKey(mnemonic);
    const wallet = tonClient.open(
        WalletContractV4.create({
            workchain: 0,
            publicKey: keys.publicKey,
        }),
    );

    console.info(wallet.address);
    const sender = wallet.sender(keys.secretKey);

    const factory = tonClient.open(
        Factory.createFromAddress(MAINNET_FACTORY_ADDR),
    );

    const scale = tonClient.open(JettonRoot.createFromAddress(SCALE_ADDR));

    const pool = tonClient.open(
        Pool.createFromAddress(
            await factory.getPoolAddress({
                poolType: PoolType.VOLATILE,
                assets: [Asset.native(), Asset.jetton(scale.address)],
            }),
        ),
    );

    const nativeVault = tonClient.open(
        VaultNative.createFromAddress(
            await factory.getVaultAddress(Asset.native()),
        ),
    );

    const lastBlock = await tonClient.getLastBlock();
    const poolState = await tonClient.getAccountLite(
        lastBlock.last.seqno,
        pool.address,
    );

    if (poolState.account.state.type !== "active") {
        throw new Error("Pool is not exist.");
    }

    const vaultState = await tonClient.getAccountLite(
        lastBlock.last.seqno,
        nativeVault.address,
    );

    if (vaultState.account.state.type !== "active") {
        throw new Error("Native Vault is not exist.");
    }

    const amountIn = toNano("1"); // 1 TON

    const { amountOut: expectedAmountOut } = await pool.getEstimatedSwapOut({
        assetIn: Asset.native(),
        amountIn,
    });

    // Slippage handling (1%)
    const minAmountOut = (expectedAmountOut * 99n) / 100n; // expectedAmountOut - 1%

    let newVar = await nativeVault.sendSwap(
        sender,
        {
            poolAddress: pool.address,
            amount: amountIn,
            limit: minAmountOut,
            gasAmount: toNano("0.25"),
        },
    );

    console.info(newVar)
}

main().catch(console.dir);
