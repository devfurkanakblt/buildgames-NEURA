import request from 'supertest';
import app from '../src/index.js';

describe('API Configuration & Security Tests', () => {
    describe('GET /health', () => {
        it('Should return 200 and valid status object', async () => {
            const res = await request(app).get('/health');
            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toBe('ok');
            expect(res.body.service).toBe('neura-backend');
        });

        it('Should include Security Headers (Helmet)', async () => {
            const res = await request(app).get('/health');
            expect(res.headers).toHaveProperty('x-dns-prefetch-control');
            expect(res.headers).toHaveProperty('x-frame-options');
            expect(res.headers['x-powered-by']).toBeUndefined();
        });
    });

    describe('Rate Limiting', () => {
        it('Should apply Rate Limiting headers to /api routes', async () => {
            // Even if it returns 404 or 401, the rate limit headers arrive
            const res = await request(app).get('/api/company/tasks');
            expect(res.headers).toHaveProperty('ratelimit-limit');
            expect(res.headers['ratelimit-limit']).toBe('100');
        });

        it('Should NOT apply Rate Limiting to non-API routes', async () => {
            const res = await request(app).get('/health');
            expect(res.headers).not.toHaveProperty('ratelimit-limit');
        });
    });
});
