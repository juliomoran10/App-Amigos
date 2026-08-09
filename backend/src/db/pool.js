const { Pool } = require('pg');

function buildPoolConfig() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Add your Neon connection string to .env');
  }

  const config = { connectionString };

  if (process.env.DATABASE_SSL !== 'false') {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
}

const pool = new Pool(buildPoolConfig());

pool.on('error', (error) => {
  console.error('[db] Unexpected pool error:', error);
});

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = {
  pool,
  query
};
