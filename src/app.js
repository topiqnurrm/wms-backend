const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

const authRoutes = require('./routes/auth');
const warehouseRoutes = require('./routes/warehouse');
const assetRoutes = require('./routes/asset');
const supplierRoutes = require('./routes/supplier');
const storageBinRoutes = require('./routes/storageBin');
const assetMovementRoutes = require('./routes/assetMovement');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/warehouses', warehouseRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/storage-bins', storageBinRoutes);
app.use('/api/v1/asset-movements', assetMovementRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.use(errorHandler);

module.exports = app;