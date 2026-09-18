import { motion } from 'framer-motion'
import MovieCard from './MovieCard'

function MovieSkeleton() {
  return <div className="movie-card movie-card-skeleton" aria-hidden="true"><div className="poster-frame skeleton-poster" /><div className="movie-card-info"><div className="skeleton-line skeleton-wide" /><div className="skeleton-line" /><div className="skeleton-line skeleton-short" /></div></div>
}

export default function MovieGrid({ movies, isLoading }) {
  if (isLoading) return <div className="movie-grid" aria-label="Loading movies">{Array.from({ length: 10 }, (_, index) => <MovieSkeleton key={index} />)}</div>
  if (!movies.length) return <div className="grid-state">No verified movie records match this view.</div>
  return <div className="movie-grid">{movies.map((movie, index) => <motion.div key={movie.id} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, delay: Math.min(index * .045, .45), ease: [0.22, 1, 0.36, 1] }}><MovieCard movie={movie} index={index} /></motion.div>)}</div>
}
