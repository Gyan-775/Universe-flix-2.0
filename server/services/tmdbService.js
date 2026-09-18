const axios = require('axios')

const tmdbClient = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  timeout: 20000,
  headers: {
    accept: "application/json"
  }
})

function getReadAccessToken() {
  const token = process.env.TMDB_READ_ACCESS_TOKEN?.trim()
  if (!token) {
    const error = new Error('TMDB_READ_ACCESS_TOKEN is not configured or is empty')
    error.code = 'TMDB_CONFIG_MISSING'
    throw error
  }
  return token
}

async function tmdbRequest(path, params = {}) {
  const token = getReadAccessToken()

  try {
    const response = await tmdbClient.get(path, {
      params: { language: 'en-US', ...params },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    const status = error.response?.status || null
    const statusText = error.response?.statusText || null
    const responseData = error.response?.data || null
    const requestUrl = error.config?.baseURL && error.config?.url
      ? new URL(error.config.url, error.config.baseURL).toString()
      : `${tmdbClient.defaults.baseURL}${path}`
    console.error('TMDB request failed', {
      status,
      statusText,
      data: responseData,
      url: requestUrl,
      code: error.code || null,
    })

    const wrapped = new Error(responseData?.status_message || error.message || 'TMDB request failed')
    wrapped.code = error.code === 'ECONNABORTED' ? 'TMDB_TIMEOUT' : 'TMDB_REQUEST_FAILED'
    wrapped.status = status || (error.code === 'ECONNABORTED' ? 504 : 502)
    wrapped.tmdbData = responseData
    wrapped.tmdbStatusText = statusText
    wrapped.tmdbUrl = requestUrl
    wrapped.cause = error
    throw wrapped
  }
}

function getPopularMovies(page = 1) {
  return tmdbRequest('/movie/popular', { page })
}

function discoverMovies(params = {}) {
  return tmdbRequest('/discover/movie', { page: 1, include_adult: false, sort_by: 'popularity.desc', ...params })
}

function getTrending(window = 'week') {
  return tmdbRequest(`/trending/movie/${window}`)
}

function getTopRated(page = 1) {
  return tmdbRequest('/movie/top_rated', { page })
}

function getUpcoming(page = 1) {
  return tmdbRequest('/movie/upcoming', { page })
}

function searchMovies(query, page = 1) {
  return tmdbRequest('/search/movie', { query, page, include_adult: false })
}

function getMovieDetails(id) {
  return tmdbRequest(`/movie/${id}`, { append_to_response: 'credits,videos,external_ids' })
}

function getMovieSummary(id) {
  return tmdbRequest(`/movie/${id}`)
}

function getSimilarMovies(id, page = 1) {
  return tmdbRequest(`/movie/${id}/similar`, { page })
}

function getCollectionDetails(id) {
  return tmdbRequest(`/collection/${id}`)
}

function testAuthentication() {
  return tmdbRequest('/authentication')
}

function getGenres() {
  return tmdbRequest('/genre/movie/list')
}

module.exports = { getPopularMovies, discoverMovies, getTrending, getTopRated, getUpcoming, searchMovies, getMovieDetails, getMovieSummary, getSimilarMovies, getCollectionDetails, getGenres, testAuthentication }
