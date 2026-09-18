function getYear(releaseDate) {
  if (!releaseDate || typeof releaseDate !== 'string') {
    return null
  }

  const year = Number.parseInt(releaseDate.slice(0, 4), 10)

  return Number.isNaN(year) ? null : year
}


function normalizePerson(person = {}) {
  return {
    id: person.id ?? null,
    name: person.name || null,
    character: person.character || null,
    profilePath: person.profile_path || person.profilePath || null,
  }
}


function normalizeMovie(movie = {}) {
  const releaseDate = movie.release_date || movie.releaseDate || null

  const directors = Array.isArray(movie.credits?.crew)
    ? movie.credits.crew
        .filter((person) => person.job === 'Director')
        .map((person) => person.name)
        .filter(Boolean)
    : []

  const trailer = Array.isArray(movie.videos?.results)
    ? (
        movie.videos.results.find(
          (video) =>
            video.site === 'YouTube' &&
            video.type === 'Trailer' &&
            video.official !== false
        ) ||
        movie.videos.results.find(
          (video) =>
            video.site === 'YouTube' &&
            video.type === 'Trailer'
        )
      )
    : null

  return {
    id: movie.id ?? null,

    title: movie.title || movie.original_title || null,

    originalTitle:
      movie.original_title || movie.originalTitle || null,

    releaseDate,

    year: getYear(releaseDate),

    universe:
      typeof movie.universe === 'object'
        ? movie.universe
        : null,

    genres: Array.isArray(movie.genres)
      ? movie.genres
          .map((genre) =>
            typeof genre === 'string' ? genre : genre.name
          )
          .filter(Boolean)
      : Array.isArray(movie.genre_ids)
        ? movie.genre_ids
            .map((id) => movie.genreMap?.[id])
            .filter(Boolean)
        : [],

    posterPath:
      movie.poster_path || movie.posterPath || null,

    backdropPath:
      movie.backdrop_path || movie.backdropPath || null,

    overview: movie.overview || null,

    runtime: movie.runtime ?? null,

    tmdbRating:
      movie.vote_average ?? movie.tmdbRating ?? null,

    tmdbVoteCount:
      movie.vote_count ?? movie.tmdbVoteCount ?? null,

    imdbRating: null,

    imdbId:
      movie.external_ids?.imdb_id ||
      movie.imdb_id ||
      null,

    imdbUrl: movie.external_ids?.imdb_id
      ? `https://www.imdb.com/title/${movie.external_ids.imdb_id}/`
      : null,

    cast: Array.isArray(movie.credits?.cast)
      ? movie.credits.cast
          .slice(0, 10)
          .map(normalizePerson)
      : [],

    director: directors.length
      ? directors.join(', ')
      : null,

    trailer: trailer?.key
      ? `https://www.youtube.com/watch?v=${trailer.key}`
      : null,

    videos: Array.isArray(movie.videos?.results)
      ? movie.videos.results.map((video) => ({
          id: video.id ?? null,
          key: video.key ?? null,
          name: video.name ?? null,
          site: video.site ?? null,
          type: video.type ?? null,
          official: video.official ?? null,
        }))
      : [],

    popularity: movie.popularity ?? null,

    voteCount:
      movie.vote_count ?? movie.voteCount ?? null,

    prerequisites: [],

    recommendedBefore: [],
  }
}


module.exports = {
  normalizeMovie,
}