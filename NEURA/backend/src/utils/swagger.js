import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Neura API Documentation',
            version: '1.0.0',
            description: 'REST API documentation for the Neura Label-to-Earn Platform',
        },
        servers: [
            {
                url: 'http://localhost:3002',
                description: 'Local Development Server',
            },
        ],
    },
    apis: ['./src/routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
