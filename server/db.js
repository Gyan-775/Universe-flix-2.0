const { Pool } = require('pg')

const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000 }) : null

function requireDatabase() {
  if (!pool) {
    const error = new Error('DATABASE_URL is not configured')
    error.code = 'DATABASE_NOT_CONFIGURED'
    error.status = 503
    throw error
  }
  return pool
}

async function query(text, params) {
  return requireDatabase().query(text, params)
}

async function checkDatabase() {
  if (!pool) return { configured: false, connected: false }
  try { await pool.query('SELECT 1'); return { configured: true, connected: true } } catch (error) { return { configured: true, connected: false, error: error.message } }
}

module.exports = { pool, query, requireDatabase, checkDatabase }
