import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useParams } from '../router'
import { useMovieDetails } from '../hooks/useMovieDetails'
import { getSimilarMovies } from '../services/movieService'
import { getWatchOrder } from '../services/watchOrderService'
import { recordInteraction } from '../services/sessionService'
import MovieCard from '../components/movies/MovieCard'
import MovieDetailSkeleton from '../components/movies/MovieDetailSkeleton'
import { backdropUrl, posterUrl, profileUrl } from '../utils/imageUrl'

function formatRuntime(runtime) {
  if (!runtime) return null
  return `${Math.floor(runtime / 60)}h ${runtime % 60}m`
}

export default function MoviePage() {
  const { id } = useParams()
  const { movie, loading, error, refetch } = useMovieDetails(id)
  const [similar, setSimilar] = useState([])
  const [watchOrder, setWatchOrder] = useState([])
  const [watchMode, setWatchMode] = useState('essential')
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [watchOrderOpen, setWatchOrderOpen] = useState(false)
  const [similarLoading, setSimilarLoading] = useState(false)

  useEffect(() => {
    if (!movie?.id) return undefined
    document.title = `${movie.title || 'Movie'} — Universe-flix`
    recordInteraction('movie_view', movie.id).catch(() => {})
    const controller = new AbortController()
    setSimilarLoading(true)
    getSimilarMovies(movie.id, { signal: controller.signal }).then((movies) => {
      if (!controller.signal.aborted) setSimilar(movies)
    }).catch(() => {}).finally(() => {
      if (!controller.signal.aborted) setSimilarLoading(false)
    })
    return () => controller.abort()
  }, [movie])

  useEffect(() => {
    if (!movie?.id) return undefined
    const controller = new AbortController()
    getWatchOrder(movie.id, watchMode, { signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted) setWatchOrder(data.movies || [])
    }).catch(() => {})
    return () => controller.abort()
  }, [movie, watchMode])

  useEffect(() => {
    if (!trailerOpen && !watchOrderOpen) return undefined
    const onKeyDown = (event) => { if (event.key === 'Escape') { setTrailerOpen(false); setWatchOrderOpen(false) } }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [trailerOpen, watchOrderOpen])

  if (loading) return <MovieDetailSkeleton />
  if (error) return <main className="route-page detail-error-page"><button className="back-link back-button" type="button" onClick={() => window.history.back()}>← Back to archive</button><div className="archive-error"><strong>ARCHIVE SIGNAL LOST</strong><span>Unable to retrieve this movie.</span><button className="button button-primary" type="button" onClick={refetch}>Retry</button></div></main>
  if (!movie) return <main className="route-page detail-error-page"><button className="back-link back-button" type="button" onClick={() => window.history.back()}>← Back to archive</button><div className="grid-state">Movie not found.</div></main>

  const poster = posterUrl(movie.posterPath)
  const backdrop = backdropUrl(movie.backdropPath)
  const genres = Array.isArray(movie.genres) ? movie.genres : []
  const cast = Array.isArray(movie.cast) ? movie.cast.slice(0, 10) : []
  const videos = Array.isArray(movie.videos) ? movie.videos : []
  const trailerVideo = videos.find((video) => video.site === 'YouTube' && video.type === 'Trailer' && video.official !== false) || videos.find((video) => video.site === 'YouTube' && ['Trailer', 'Teaser', 'Clip'].includes(video.type))
  const trailerUrl = movie.trailer || (trailerVideo?.key ? `https://www.youtube.com/watch?v=${trailerVideo.key}` : null)
  const meta = [movie.year, formatRuntime(movie.runtime)].filter(Boolean)

  return <main className="route-page movie-detail-page movie-detail-experience" style={backdrop ? { '--detail-backdrop': `url(${backdrop})` } : undefined}>
    <button className="back-link back-button" type="button" onClick={() => window.history.back()}>← Back to archive</button>
    <section className="detail-hero">
      <div className="detail-hero-poster">{poster ? <img src={poster} alt={movie.title || 'Movie poster'} /> : <div className="poster-empty">POSTER<br />UNAVAILABLE</div>}</div>
      <motion.div className="detail-hero-copy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
        <p className="eyebrow">{movie.universe?.name || 'THE ARCHIVE'} <span className="detail-slash">/ {movie.id}</span></p>
        <h1>{movie.title || 'Movie details'}</h1>
        {movie.originalTitle && movie.originalTitle !== movie.title && <p className="detail-original-title">{movie.originalTitle}</p>}
        {(meta.length > 0 || genres.length > 0) && <div className="movie-detail-meta">{meta.map((item) => <span key={item}>{item}</span>)}{genres.length > 0 && <span>{genres.join(' · ')}</span>}</div>}
        <div className="detail-rating-row">{movie.tmdbRating !== null && movie.tmdbRating !== undefined && <span><b>TMDB</b> {Number(movie.tmdbRating).toFixed(1)}</span>}{movie.imdbRating !== null && movie.imdbRating !== undefined && <span><b>IMDb</b> {Number(movie.imdbRating).toFixed(1)}</span>}</div>
        <p className="movie-detail-overview">{movie.overview || 'Overview unavailable.'}</p>
        <div className="detail-actions">{trailerUrl && <button className="button button-primary" type="button" onClick={() => setTrailerOpen(true)}>Trailer <span>▶</span></button>}{movie.imdbUrl && <a className="button button-quiet" href={movie.imdbUrl} target="_blank" rel="noreferrer">View on IMDb <span>↗</span></a>}<button className="button button-quiet" type="button" onClick={() => setWatchOrderOpen(true)}>Watch order</button></div>
        {movie.universe?.slug && <Link className="detail-universe-link" to={`/universe/${movie.universe.slug}`}>UNIVERSE / {movie.universe.name}</Link>}
      </motion.div>
    </section>
    {movie.director && <section className="detail-subsection detail-fact-section"><p className="eyebrow">DIRECTED BY</p><p>{movie.director}</p></section>}
    {cast.length > 0 && <section className="detail-subsection"><p className="eyebrow">TOP CAST</p><div
    className="cast-rail"
    onMouseMove={(event) => {
        const element = event.currentTarget
        const rect = element.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const edge = rect.width * 0.25

        if (mouseX < edge) {
            element.scrollLeft -= 3
        } else if (mouseX > rect.width - edge) {
            element.scrollLeft += 3
        }
    }}
>{cast.map((person) => { const profile = profileUrl(person.profilePath); return <div className="cast-credit" key={person.id || person.name}><div className="cast-avatar">{profile ? <img src={profile} alt={person.name || 'Cast member'} loading="lazy" /> : <span aria-hidden="true">+</span>}</div><b>{person.name || 'Cast member'}</b>{person.character && <small>{person.character}</small>}</div> })}</div></section>}
    <section className="detail-subsection similar-section"><div className="detail-section-heading"><div><p className="eyebrow">SIMILAR SIGNALS</p><h2>You may like</h2></div></div>{similarLoading ? <div className="detail-loading">Finding related signals...</div> : similar.length > 0 ? <div className="similar-grid">{similar.map((item, index) => <MovieCard key={item.id} movie={item} index={index} />)}</div> : <p className="detail-muted">No similar titles are available.</p>}</section>
    <AnimatePresence>{trailerOpen && <div className="detail-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setTrailerOpen(false) }}><motion.div className="detail-modal" role="dialog" aria-modal="true" aria-label="Movie trailer" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .96 }}><button className="modal-close" type="button" aria-label="Close trailer" onClick={() => setTrailerOpen(false)}>×</button><div className="trailer-frame"><iframe src={trailerUrl?.replace('watch?v=', 'embed/')} title={`${movie.title} trailer`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div></motion.div></div>}</AnimatePresence>
    <AnimatePresence>{watchOrderOpen && <div className="detail-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setWatchOrderOpen(false) }}><motion.div className="detail-modal watch-order-modal" role="dialog" aria-modal="true" aria-label="Watch order" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }}><button className="modal-close" type="button" aria-label="Close watch order" onClick={() => setWatchOrderOpen(false)}>×</button><p className="eyebrow">WHAT SHOULD I WATCH FIRST?</p><div className="watch-mode-row">{['essential', 'complete', 'release'].map((mode) => <button className={watchMode === mode ? 'active' : ''} type="button" key={mode} onClick={() => setWatchMode(mode)}>{mode}</button>)}</div>{watchOrder.length ? <ol className="watch-order-preview">{watchOrder.map((item, index) => <li key={item.id || index}><span>{String(index + 1).padStart(2, '0')}</span>{item.title}</li>)}</ol> : <p className="detail-muted">No verified watch-order relationships are available yet.</p>}</motion.div></div>}</AnimatePresence>
  </main>
}
