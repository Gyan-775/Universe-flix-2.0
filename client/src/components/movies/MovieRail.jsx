import { useRef } from 'react'
import { motion } from 'framer-motion'
import MovieCard from './MovieCard'

function RailSkeleton() {
  return <div className="movie-rail-skeleton movie-card-skeleton"><div className="poster-frame skeleton-poster" /><div className="movie-card-info"><div className="skeleton-line skeleton-wide" /><div className="skeleton-line skeleton-short" /></div></div>
}

export default function MovieRail({ eyebrow, title, subtitle, movies = [], loading = false, error = null, onRetry, hideHeading = false }) {
  const railRef = useRef(null)
  const move = (direction) => railRef.current?.scrollBy({ left: direction * railRef.current.clientWidth * .78, behavior: 'smooth' })

  return <section className="home-rail-section">
    {!hideHeading && <div className="home-rail-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><div className="home-rail-controls"><button type="button" aria-label={`Previous ${title}`} onClick={() => move(-1)}>←</button><button type="button" aria-label={`Next ${title}`} onClick={() => move(1)}>→</button></div></div>}
    {error ? <div className="rail-error"><span>{error}</span>{onRetry && <button type="button" onClick={onRetry}>Retry</button>}</div> : <div className="movie-rail" ref={railRef}>{loading ? Array.from({ length: 6 }, (_, index) => <RailSkeleton key={index} />) : movies.map((movie, index) => <motion.div key={movie.id} className="movie-rail-item" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(index * .035, .3), duration: .35 }}><MovieCard movie={movie} index={index} /></motion.div>)}</div>}
    {!loading && !error && !movies.length && <p className="rail-empty">No verified movies match this view.</p>}
  </section>
}
