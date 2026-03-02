import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import logger from './utils/logger.js';
import { setupSwagger } from './utils/swagger.js';
import companyRoutes from './routes/company.js';
import workerRoutes from './routes/worker.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Security Middleware
app.use(helmet());

// Logging Middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api', limiter); // Apply rate limiter to API routes only

// API Documentation
setupSwagger(app);

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
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`\n🚀 Neura Backend running on http://localhost:${PORT}`);
        console.log(`   Health: http://localhost:${PORT}/health`);
        console.log(`   Company API: http://localhost:${PORT}/api/company/tasks`);
        console.log(`   Worker API: http://localhost:${PORT}/api/worker/tasks\n`);
    });
}

export default app;
