require('dotenv').config({ path: require('path').join(__dirname, '.env') })

const cors = require('cors')
const express = require('express')
const movieRoutes = require('./routes/movieRoutes')
const universeRoutes = require('./routes/universeRoutes')
const genreRoutes = require('./routes/genreRoutes')
const homeRoutes = require('./routes/homeRoutes')
const watchOrderRoutes = require('./routes/watchOrderRoutes')
const tmdbService = require('./services/tmdbService')
const { checkDatabase } = require('./db')
const sessionRoutes = require('./routes/sessionRoutes')
const recommendationRoutes = require('./routes/recommendationRoutes')

const app = express()
const port = Number.parseInt(process.env.PORT || '5000', 10)

app.disable('x-powered-by')
app.use(cors())
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (req, res) => {
  checkDatabase().then((database) => res.json({ status: 'ok', service: 'universe-flix-api', database })).catch(() => res.json({ status: 'ok', service: 'universe-flix-api', database: { configured: false, connected: false } }))
})

app.get('/api/tmdb-test', async (req, res, next) => {
  try {
    await tmdbService.testAuthentication()
    return res.json({ ok: true })
  } catch (error) {
    return next(error)
  }
})

app.use('/api/movies', movieRoutes)
app.use('/api/universes', universeRoutes)
app.use('/api/genres', genreRoutes)
app.use('/api/home', homeRoutes)
app.use('/api/watch-order', watchOrderRoutes)
app.use('/api/session', sessionRoutes)
app.use('/api/recommendations', recommendationRoutes)

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  const status = error.code === 'TMDB_CONFIG_MISSING' ? 503 : error.code === 'TMDB_TIMEOUT' ? 504 : error.status || 500
  const response = { error: error.message }
  if (process.env.NODE_ENV !== 'production' && error.tmdbData) response.tmdb = error.tmdbData
  return res.status(status).json(response)
})

app.listen(port, () => {
  console.log(`Universe-flix API listening on port ${port}`)
})

module.exports = app
