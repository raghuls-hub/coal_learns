const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.PG_URI,
  max: 20,
  min: 4,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 30000,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PG pool error:', err.message);
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL Connected');
    client.release();

    process.on('SIGINT', async () => {
      await pool.end();
      console.log('PostgreSQL pool closed');
      process.exit(0);
    });
  } catch (error) {
    console.error(`❌ PostgreSQL connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
