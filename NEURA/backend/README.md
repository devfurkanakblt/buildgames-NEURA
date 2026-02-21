# Neura Backend API

Backend service for the Neura Label-to-Earn platform.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

```bash
# Install PostgreSQL (if not installed)
# Windows: Download from postgresql.org
# Mac: brew install postgresql

# Create database
createdb neura_db

# Run migrations
psql neura_db < src/database/schema.sql
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

**Required Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `PINATA_JWT`: Get from https://app.pinata.cloud/developers/api-keys
- `NEURA_CORE_ADDRESS`: Deployed contract address
- `PRIVATE_KEY`: Backend wallet (for reward distribution)

### 4. Run Server

```bash
npm run dev  # Development (with nodemon)
npm start    # Production
```

Server will start on `http://localhost:3002`

## API Endpoints

### Health Check
```
GET /health
```

### Company Endpoints
```
POST /api/company/tasks        - Create new task
GET  /api/company/tasks/:id    - Get task results
```

### Worker Endpoints
```
GET  /api/worker/tasks         - List available tasks
POST /api/worker/submit        - Submit tile selection
```

## Architecture

```
backend/
├── src/
│   ├── index.js              # Express server
│   ├── database/
│   │   ├── db.js            # PostgreSQL pool
│   │   └── schema.sql       # Database schema
│   ├── middleware/
│   │   └── auth.js          # Wallet signature verification
│   ├── services/
│   │   ├── imageProcessor.js # Sharp + Pinata
│   │   ├── consensus.js     # Voting algorithm
│   │   └── blockchain.js    # ethers.js contract calls
│   └── routes/
│       ├── company.js       # Company API
│       └── worker.js        # Worker API
├── package.json
└── .env
```

## Testing

```bash
# Test database connection
npm run dev

# Check health endpoint
curl http://localhost:3002/health
```

## Pinata Setup

1. Go to https://app.pinata.cloud
2. Create account (free tier works!)
3. Go to "API Keys" → "New Key"
4. Give permissions: `pinFileToIPFS`
5. Copy JWT token to `.env`

## Next Steps

- [ ] Implement image processing service
- [ ] Create company routes
- [ ] Create worker routes
- [ ] Test with Postman
- [ ] Connect to frontend
