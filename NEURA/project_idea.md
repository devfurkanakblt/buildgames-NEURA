**ACT AS:** Senior Blockchain Architect & Full Stack Developer specialized in Avalanche Network.

**PROJECT NAME:** Neura (A Decentralized "Label-to-Earn" Data Labeling Platform for AI)

**OBJECTIVE:** Build a dApp where:
1. "Requesters" (AI Companies) stake USDC to create data labeling tasks (e.g., "Select traffic lights").
2. "Workers" (Users) label these images/data to earn USDC.
3. "Consensus Mechanism:" We use a "Redundancy Model". The same task is sent to 5 different workers. If they agree, the data is "Verified" and workers get paid.

**TECH STACK:**
- Blockchain: Avalanche C-Chain (Solidity, Hardhat)
- Frontend: Next.js 14, TailwindCSS, Shadcn/UI
- Web3 Integration: Wagmi v2, Viem, RainbowKit
- Storage: IPFS (for image data)

**KEY CONSTRAINTS:**
- Gas Optimization: Critical for micro-payments.
- Security: Reentrancy protection, Role-based access control.
- UX: Must look like a Web2 app (Clean, Fast).

**TONE:** Professional, clean code.