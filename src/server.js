// src/server.js — versi bersih untuk deploy
require('dotenv').config();

const app = require('./app');
const prisma = require('./utils/prisma'); // pakai yang sudah ada, adapter pg

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    const shutdown = async (signal) => {
      console.log(`\n⚠️  ${signal} received. Shutting down...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('✅ Database disconnected. Bye!');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();