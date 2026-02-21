import { ethers } from 'ethers';

/**
 * Middleware to verify wallet signatures
 * Protects endpoints from unauthorized access
 */
export async function verifySignature(req, res, next) {
    try {
        const walletAddress = req.headers['x-wallet-address'];
        const signature = req.headers['x-signature'];
        const message = req.body.message;

        if (!walletAddress || !signature || !message) {
            return res.status(400).json({
                error: 'Missing authentication headers',
                required: ['x-wallet-address', 'x-signature', 'message in body']
            });
        }

        // Verify signature
        const recoveredAddress = ethers.verifyMessage(message, signature);

        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            return res.status(401).json({
                error: 'Invalid signature',
                expected: walletAddress,
                recovered: recoveredAddress
            });
        }

        // Add verified address to request
        req.walletAddress = walletAddress;
        next();
    } catch (error) {
        console.error('Signature verification error:', error);
        res.status(401).json({ error: 'Signature verification failed' });
    }
}

export default { verifySignature };
