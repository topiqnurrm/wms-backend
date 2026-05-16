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
    return getPrisma()[prop];
  }
});

module.exports = prismaProxy;