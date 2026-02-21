# Neura Frontend - Neural Interface

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and add your WalletConnect Project ID and contract address

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🎨 Features

### ✨ Holographic UI Design
- Glassmorphism cards with gradient borders
- Neon button styling (Cyan/Green for YES, Red/Pink for NO)
- Framer Motion animations (glitch effects, fade-ins, pulses)
- Neural network loading animations

### 🔗 Web3 Integration
- **RainbowKit** for wallet connection
- **Wagmi v2** for contract interactions
- **Viem** for Ethereum utilities
- Support for Avalanche Fuji and Mainnet

### 🧠 Commit-Reveal Flow
1. **Connect Wallet** → Avalanche network
2. **Register as Node** → Stake 0.1 AVAX
3. **Vote on Task** → Click YES/NO (Phase 1: Commit)
4. **Reveal Answer** → Confirm choice (Phase 2: Reveal)
5. **Earn Rewards** → Get paid based on consensus

### 📊 Dashboard Features
- Real-time reputation score tracking
- Task completion statistics
- Accuracy percentage display
- Grid of active labeling tasks
- IPFS image display

## 📁 Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with Web3 providers
│   ├── page.tsx            # Main dashboard
│   └── globals.css         # Global styles + custom utilities
├── components/
│   ├── TaskCard.tsx        # Holographic task card with commit-reveal
│   └── NeuralLoader.tsx    # Loading animation
├── lib/
│   ├── contracts/
│   │   ├── NeuraCore.ts   # Contract ABI and config
│   │   └── hooks.ts        # Custom Wagmi hooks
│   ├── ipfs.ts             # IPFS utilities
│   └── wagmi.ts            # Wagmi configuration
└── public/                 # Static assets
```

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
NEXT_PUBLIC_AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_NEURA_CORE_ADDRESS=0x... # Your deployed contract address
NEXT_PUBLIC_IPFS_GATEWAY=https://w3s.link/ipfs/
NEXT_PUBLIC_CHAIN_ID=43113
```

### Get WalletConnect Project ID
1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Create a new project
3. Copy the Project ID to `.env`

### Update Contract Address
After deploying NeuraCore.sol:
1. Copy the contract address
2. Update `NEXT_PUBLIC_NEURA_CORE_ADDRESS` in `.env`

## 🎯 How It Works

### Commit-Reveal Scheme

**Why?** Prevents mempool snooping where malicious users could copy answers.

**How:**
1. User clicks YES/NO
2. Frontend generates random secret
3. Computes hash: `keccak256(taskId + choice + secret)`
4. Sends commit transaction with hash only
5. Secret stored in sessionStorage
6. User clicks "Reveal"
7. Sends reveal transaction with choice + secret
8. Contract verifies hash matches original commit

### State Management

TaskCard component states:
- `idle` → Ready to vote
- `committing` → Transaction pending (Phase 1)
- `committed` → Waiting for reveal
- `revealing` → Transaction pending (Phase 2)
- `completed` → Vote successfully submitted

### IPFS Integration

Images are loaded from IPFS via gateway:
```typescript
getIpfsUrl("QmXxx...") 
// Returns: https://w3s.link/ipfs/QmXxx...
```

## 🎨 Styling Guide

### Custom Tailwind Classes

```css
.holographic-card      /* Glass card with gradient shimmer */
.neon-success          /* Green-cyan gradient button (YES) */
.neon-danger           /* Red-pink gradient button (NO) */
.neural-glow           /* Pulsing cyan glow effect */
.neural-spinner        /* Loading spinner */
```

### Custom Animations

- `animate-glitch` → Glitch effect on hover
- `animate-pulse-glow` → Pulsing glow
- `animate-float` → Floating effect

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Build Locally

```bash
npm run build
npm start
```

## 🐛 Troubleshooting

### Wagmi Hooks Not Working
- Ensure contract address is correct in `.env`
- Check network is Avalanche Fuji (Chain ID: 43113)
- Verify contract is deployed on current network

### IPFS Images Not Loading
- Check IPFS gateway is accessible
- Try alternative gateway: `https://ipfs.io/ipfs/`
- Verify IPFS hash format is valid

### Transactions Failing
- Ensure wallet has sufficient AVAX for gas
- Check if already registered as node
- Verify task is still active

## 📚 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Animations:** Framer Motion
- **Web3:** Wagmi v2, Viem, RainbowKit
- **State:** React Query (TanStack Query)

## 🔗 Links

- [Wagmi Docs](https://wagmi.sh)
- [RainbowKit Docs](https://www.rainbowkit.com)
- [Avalanche Docs](https://docs.avax.network)
- [Framer Motion](https://www.framer.com/motion/)

---

**Built with ❤️ for Avalanche BuildGames Hackathon**
