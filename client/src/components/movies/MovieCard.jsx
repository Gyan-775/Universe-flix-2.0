import { memo } from 'react'
import { Link } from '../../router'
import { posterUrl } from '../../utils/imageUrl'

function MovieCard({ movie, index = 0 }) {
  const poster = posterUrl(movie.posterPath)
  const genres = Array.isArray(movie.genres) ? movie.genres : []
  return (
    <article className="movie-card" style={{ '--card-index': index }}>
      <Link to={`/movie/${movie.id}`} className="movie-card-link">
        <div className="poster-frame">
          {poster ? <img src={poster} alt={movie.title} loading="lazy" /> : <div className="poster-empty" aria-label="Poster unavailable">ARCHIVE<br />IMAGE<br />PENDING</div>}
          <span className="poster-index">{String(index + 1).padStart(2, '0')}</span>
        </div>
        <div className="movie-card-info">
          {movie.universe?.name && <p className="movie-universe">{movie.universe.name}</p>}
          <h3>{movie.title || 'Untitled movie'}</h3>
          <div className="movie-meta"><span>{movie.year || '—'}</span><span>{movie.tmdbRating !== null && movie.tmdbRating !== undefined ? `TMDB ${Number(movie.tmdbRating).toFixed(1)}` : 'Rating pending'}</span></div>
          <div className="tag-line">{genres.slice(0, 2).join(' / ') || 'Metadata pending'}</div>
        </div>
      </Link>
    </article>
  )
}

export default memo(MovieCard)
