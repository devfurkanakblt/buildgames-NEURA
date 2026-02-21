/**
 * IPFS Utilities
 * Handles IPFS hash to URL conversion and image prefetching
 */

/**
 * Get IPFS gateway URL from environment or use default
 */
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://w3s.link/ipfs/';

/**
 * Convert IPFS hash to full gateway URL
 * @param hash - IPFS CID (e.g., "QmXxx..." or "ipfs://QmXxx...")
 * @returns Full IPFS gateway URL
 */
export function getIpfsUrl(hash: string): string {
    // Remove ipfs:// prefix if present
    const cleanHash = hash.replace('ipfs://', '');

    // If it's already a full URL, return as-is
    if (cleanHash.startsWith('http://') || cleanHash.startsWith('https://')) {
        return cleanHash;
    }

    return `${IPFS_GATEWAY}${cleanHash}`;
}

/**
 * Prefetch IPFS image for smoother UX
 * Creates an Image object to trigger browser caching
 * @param hash - IPFS CID
 */
export async function prefetchIpfsImage(hash: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load IPFS image: ${hash}`));
        img.src = getIpfsUrl(hash);
    });
}

/**
 * Validate IPFS hash format
 * @param hash - String to validate
 * @returns true if valid IPFS CID
 */
export function isValidIpfsHash(hash: string): boolean {
    const cleanHash = hash.replace('ipfs://', '');
    // Basic validation: IPFS v0 CIDs start with Qm, v1 CIDs start with b
    return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58})/.test(cleanHash);
}
