const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

let _prisma = null;

const getPrisma = () => {
  if (!_prisma) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    _prisma = new PrismaClient({ adapter });
  }
  return _prisma;
};

const prismaProxy = new Proxy({}, {
  get(_, prop) {
    const client = getPrisma();
    const value = client[prop];
    // Bind method agar `this` tetap mengarah ke PrismaClient asli
    // Tanpa ini, $connect/$disconnect/$transaction bisa error
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

module.exports = prismaProxy;