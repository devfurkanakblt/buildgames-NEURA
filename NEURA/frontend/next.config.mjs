/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'w3s.link',
                pathname: '/ipfs/**',
            },
            {
                protocol: 'https',
                hostname: '*.ipfs.w3s.link',
            },
            {
                protocol: 'https',
                hostname: 'ipfs.io',
                pathname: '/ipfs/**',
            },
        ],
    },
    webpack: (config) => {
        // Fix for MetaMask SDK and other Web3 libraries
        config.externals.push('pino-pretty', 'lokijs', 'encoding');

        // Fix for React Native modules in browser environment
        config.resolve.fallback = {
            ...config.resolve.fallback,
            '@react-native-async-storage/async-storage': false,
            'react-native': false,
        };

        return config;
    },
};

export default nextConfig;
