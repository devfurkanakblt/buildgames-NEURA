/**
 * Wagmi Configuration for Avalanche C-Chain
 * Sets up Web3 providers, chains, and RainbowKit
 * Updated for Wagmi v2
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, rainbowWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import { http } from 'wagmi';
import { avalancheFuji, avalanche } from 'wagmi/chains';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export const config = getDefaultConfig({
    appName: 'Neura - Neural Interface',
    projectId,
    wallets: [
        {
            groupName: 'Recommended',
            wallets: [metaMaskWallet, walletConnectWallet, rainbowWallet],
        },
    ],
    chains: [avalancheFuji, avalanche],
    transports: {
        [avalancheFuji.id]: http(),
        [avalanche.id]: http(),
    },
    ssr: true,
});
