import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import companyRoutes from './routes/company.js';
import workerRoutes from './routes/worker.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'neura-backend',
        timestamp: new Date().toISOString(),
        env: {
            db: !!process.env.DATABASE_URL,
            pinata: !!process.env.PINATA_JWT,
            blockchain: !!process.env.NEURA_CORE_ADDRESS,
        }
    });
});

// Routes
app.use('/api/company', companyRoutes);
app.use('/api/worker', workerRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Neura Backend running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Company API: http://localhost:${PORT}/api/company/tasks`);
    console.log(`   Worker API: http://localhost:${PORT}/api/worker/tasks\n`);
});
