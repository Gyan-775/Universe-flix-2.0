const { cachedRequest } = require('./cacheService')
const tmdbService = require('./tmdbService')

async function getWatchOrder(movieId, mode = 'essential') {
  const result = await cachedRequest(
    `watch-order:${movieId}:${mode}`,
    async () => {
      const movie = await tmdbService.getMovieDetails(movieId)

      if (!movie?.id) {
        return {
          movieId: Number(movieId),
          mode,
          movies: [],
        }
      }

      if (mode === 'release') {
        return getReleaseOrder(movieId, movie)
      }

      if (mode === 'complete') {
        return getCompleteOrder(movieId, movie)
      }

      if (mode === 'essential') {
        return getEssentialOrder(movieId, movie)
      }

      return {
        movieId: Number(movieId),
        mode,
        movies: [],
      }
    },
    5 * 60 * 1000
  )

  return result.value
}

async function getReleaseOrder(movieId, movie) {
  const collectionId = movie?.belongs_to_collection?.id

  if (!collectionId) {
    return {
      movieId: Number(movieId),
      mode: 'release',
      movies: [],
    }
  }

  const collection = await tmdbService.getCollectionDetails(collectionId)

  const movies = [...(collection.parts || [])]
    .sort(compareReleaseDate)

  return {
    movieId: Number(movieId),
    mode: 'release',
    movies,
  }
}

async function getCompleteOrder(movieId, movie) {
  const collectionId = movie?.belongs_to_collection?.id

  if (collectionId) {
    const collection = await tmdbService.getCollectionDetails(collectionId)

    const movies = [...(collection.parts || [])]
      .sort(compareReleaseDate)

    return {
      movieId: Number(movieId),
      mode: 'complete',
      movies,
    }
  }

  const [recommendations, similar] = await Promise.all([
    tmdbService.getMovieRecommendations(movieId),
    tmdbService.getSimilarMovies(movieId),
  ])

  const movieMap = new Map()

  for (const item of [
    ...(recommendations?.results || []),
    ...(similar?.results || []),
    movie,
  ]) {
    if (item?.id) {
      movieMap.set(Number(item.id), item)
    }
  }

  const movies = [...movieMap.values()]
    .sort(compareReleaseDate)

  return {
    movieId: Number(movieId),
    mode: 'complete',
    movies,
  }
}

async function getEssentialOrder(movieId, movie) {
  const recommendations =
    await tmdbService.getMovieRecommendations(movieId)

  const movies = [...(recommendations?.results || [])]
    .filter((item) => Number(item.id) !== Number(movieId))
    .sort(compareReleaseDate)

  return {
    movieId: Number(movieId),
    mode: 'essential',
    movies,
  }
}

function compareReleaseDate(a, b) {
  return (
    (a.release_date || '').localeCompare(b.release_date || '') ||
    String(a.title || '').localeCompare(String(b.title || ''))
  )
}

module.exports = {
  getWatchOrder,
}