import { useEffect, useState } from 'react'
import { Link, useParams } from '../router'
import MovieGrid from '../components/movies/MovieGrid'
import { getUniverseMovies, searchUniverseMovies } from '../services/movieService'
import { getGenres } from '../services/genreService'
import { getUniverses } from '../services/universeService'

export default function UniversePage() {
  const { id: slug } = useParams()
  const [universe, setUniverse] = useState(null)
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('')
  const [genres, setGenres] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalResults, setTotalResults] = useState(0)

  useEffect(() => {
    let active = true
    getUniverses().then((items) => {
      if (active) setUniverse(items.find((item) => item.slug === slug) || null)
    }).catch(() => {})
    getGenres().then((items) => { if (active) setGenres(items) }).catch(() => {})
    return () => { active = false }
  }, [slug])

  useEffect(() => {
    const controller = new AbortController()
    const normalizedQuery = query.trim()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const result = normalizedQuery.length >= 2
          ? await searchUniverseMovies(slug, normalizedQuery, { page: 1, signal: controller.signal, genre: genre || undefined })
          : await getUniverseMovies(slug, { page: 1, limit: 24, signal: controller.signal, genre: genre || undefined })
        if (controller.signal.aborted) return
        setUniverse((current) => current || result.universe)
        setMovies(result.movies)
        setPage(result.page)
        setTotalPages(result.totalPages)
        setTotalResults(result.totalResults)
      } catch (requestError) {
        if (!controller.signal.aborted) setError(requestError)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, normalizedQuery.length >= 2 ? 300 : 0)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [slug, query, genre])

  async function loadMore() {
    const result = await getUniverseMovies(slug, { page: page + 1, limit: 24, genre: genre || undefined })
    setMovies((current) => [...current, ...result.movies].sort((left, right) => (right.releaseDate || '').localeCompare(left.releaseDate || '') || String(left.title || '').localeCompare(String(right.title || ''))))
    setPage(result.page)
    setTotalPages(result.totalPages)
  }

  const newestMovie = movies[0]

  return <main className="route-page universe-page">
    <Link className="back-link" to="/">← Return to archive</Link>
    {error ? <div className="archive-error"><strong>{error.details?.error || error.message}</strong><span>{error.details?.slug || slug}</span></div> : <>
      <p className="eyebrow">FEATURED UNIVERSE / {universe?.type || 'ARCHIVE'}</p>
      <h1>{universe?.name || 'Loading universe'}</h1>
      <p className="universe-description">{universe?.description || 'Loading universe metadata.'}</p>
      <div className="universe-summary"><span>{loading ? 'LOADING' : `${totalResults} MOVIES`}</span><span>{loading ? '' : `${movies.length} SHOWN`}</span><span>LATEST → OLDEST</span>{newestMovie?.year && <span>NEWEST {newestMovie.year}</span>}</div>
      <div className="filter-row universe-filters"><label htmlFor="universe-search">Search within universe</label><input id="universe-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this universe..." /><select value={genre} onChange={(event) => setGenre(event.target.value)}><option value="">All genres</option>{genres.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div>
      <MovieGrid movies={movies} isLoading={loading} />
      {!loading && page < totalPages && <button className="button button-quiet archive-load-more" type="button" onClick={loadMore}>Load more</button>}
    </>}
  </main>
}
