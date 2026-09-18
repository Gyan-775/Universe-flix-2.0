const fs = require('fs')
const path = require('path')
const { query, checkDatabase } = require('../db')

async function migrate() {
  const status = await checkDatabase()
  if (!status.configured) throw new Error('Set DATABASE_URL before running migrations')
  if (!status.connected) throw new Error('PostgreSQL connection failed')
  await query(fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8'))
  console.log('PostgreSQL schema applied')
}

migrate().catch((error) => { console.error(error.message); process.exitCode = 1 })
