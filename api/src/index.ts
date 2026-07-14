import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import deliveryRoutes from './routes/delivery';
import orderDetailDeliveryRoutes from './routes/orderDetailDelivery';
import productRoutes from './routes/product';
import orderDetailRoutes from './routes/orderDetail';
import orderRoutes from './routes/order';
import branchRoutes from './routes/branch';
import headquartersRoutes from './routes/headquarters';
import supplierRoutes from './routes/supplier';
import authRoutes from './routes/auth';
import auditLogRoutes from './routes/auditLog';
import { initializeDatabase } from './init-db';
import { errorHandler } from './utils/errors';
import { swaggerOptions } from './swagger-options';
import { requestLogger } from './middleware/requestLogger';

import { DB_CONFIG } from './db';

const app = express();
const port = process.env.PORT || 3000;

// Parse CORS origins from environment variable if available
const corsOrigins = process.env.API_CORS_ORIGINS
  ? process.env.API_CORS_ORIGINS.split(',')
  : [
      'http://localhost:5137',
      'http://localhost:3001',
      'http://127.0.0.1:5137',
      'http://127.0.0.1:3001',
      // Allow all Codespace domains
      /^https:\/\/.*\.app\.github\.dev$/,
      // Allow all Azure Container Apps domains
      /^https:\/\/.*\.azurecontainerapps\.io$/,
      // Allow private network IPs for local/LAN development (IPv4 octets 0–255)
      /^http:\/\/192\.168\.(25[0-5]|2[0-4]\d|1?\d?\d)\.(25[0-5]|2[0-4]\d|1?\d?\d)(:\d+)?$/,
      /^http:\/\/10\.(25[0-5]|2[0-4]\d|1?\d?\d)\.(25[0-5]|2[0-4]\d|1?\d?\d)\.(25[0-5]|2[0-4]\d|1?\d?\d)(:\d+)?$/,
      /^http:\/\/172\.(1[6-9]|2\d|3[01])\.(25[0-5]|2[0-4]\d|1?\d?\d)\.(25[0-5]|2[0-4]\d|1?\d?\d)(:\d+)?$/,
    ];

console.log('Configured CORS origins:', corsOrigins);

// Enable CORS for the frontend
app.use(
  cors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocs);
});

app.use(express.json());
app.use(cookieParser());

// Request logging middleware for traceability
app.use(requestLogger);

app.use('/api/deliveries', deliveryRoutes);
app.use('/api/order-detail-deliveries', orderDetailDeliveryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/order-details', orderDetailRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/headquarters', headquartersRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/audit-log', auditLogRoutes);

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// Add error handling middleware
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║          🐱 OctoCAT Supply API - Starting           ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');

    // Log database configuration
    console.log('┌── 📦 Database Configuration ─────────────────────────');
    console.log(`│  DB_ENGINE:       ${DB_CONFIG.DB_ENGINE}`);
    if (DB_CONFIG.DB_ENGINE === 'postgres') {
      // Mask password in connection string for security
      const maskedUrl = DB_CONFIG.DATABASE_URL.replace(
        /(:\/\/[^:]+:)([^@]+)(@)/,
        '$1****$3'
      );
      console.log(`│  DATABASE_URL:    ${maskedUrl}`);
    } else {
      console.log(`│  DB_FILE:         ${DB_CONFIG.DB_FILE}`);
      console.log(`│  DB_ENABLE_WAL:   ${DB_CONFIG.ENABLE_WAL}`);
      console.log(`│  DB_FOREIGN_KEYS: ${DB_CONFIG.FOREIGN_KEYS}`);
      console.log(`│  DB_TIMEOUT:      ${DB_CONFIG.TIMEOUT}ms`);
    }
    console.log('└───────────────────────────────────────────────────────');
    console.log('');

    console.log('🚀 Running database migrations...');
    await initializeDatabase(true); // Always attempt seeding - the seeder checks if it's needed
    console.log('✅ Database initialized successfully');
    console.log('');

    app.listen(port, () => {
      console.log('┌── 🌐 Server Ready ────────────────────────────────────');
      console.log(`│  Port:     ${port}`);
      console.log(`│  API Docs: http://localhost:${port}/api-docs`);
      console.log('└───────────────────────────────────────────────────────');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();