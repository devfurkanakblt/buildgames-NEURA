'use client';

/**
 * Root Layout with Web3 Providers
 * Sets up Wagmi, RainbowKit, and React Query
 */

import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import './globals.css';

const queryClient = new QueryClient();

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <head>
                <title>Neura - Decentralized AI Data Labeling</title>
                <meta name="description" content="Label data. Earn AVAX. Decentralized consensus on Avalanche." />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <WagmiProvider config={config}>
                    <QueryClientProvider client={queryClient}>
                        <RainbowKitProvider
                            theme={darkTheme({
                                accentColor: '#00f2ff',
                                accentColorForeground: 'black',
                                borderRadius: 'large',
                                fontStack: 'system',
                            })}
                        >
                            {children}
                        </RainbowKitProvider>
                    </QueryClientProvider>
                </WagmiProvider>
            </body>
        </html>
    );
}
