import '@rainbow-me/rainbowkit/styles.css';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

export const metadata = {
    title: 'Neura - Neural Interface',
    description: 'Label data. Earn AVAX. Decentralized consensus on Avalanche.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`dark ${spaceGrotesk.className}`}>
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
