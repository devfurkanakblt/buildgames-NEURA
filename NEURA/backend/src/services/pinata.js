import dotenv from 'dotenv';
dotenv.config();

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud';

/**
 * Upload buffer to Pinata IPFS using native FormData + Blob
 * (Compatible with Node.js 18+ native fetch)
 */
export async function uploadToPinata(buffer, filename) {
    // Use native FormData (Node 18+) with Blob
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', blob, filename);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PINATA_JWT}`,
            // DO NOT set Content-Type manually - fetch sets it automatically with boundary
        },
        body: formData,
    });

    const text = await response.text();

    if (!response.ok) {
        throw new Error(`Pinata upload failed: ${text}`);
    }

    const data = JSON.parse(text);
    return data.IpfsHash;
}

/**
 * Get public IPFS URL via Pinata gateway
 */
export function getIpfsUrl(cid) {
    return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
}

export default { uploadToPinata, getIpfsUrl };
