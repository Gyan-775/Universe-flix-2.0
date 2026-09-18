import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from '../../router'
import CinematicBackground from './CinematicBackground'
import { backdropUrl } from '../../utils/imageUrl'

export default function Hero({ movieCount, featuredMovie }) {
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const backdrop = backdropUrl(featuredMovie?.backdropPath)

  function handlePointerMove(event) {
    const bounds = event.currentTarget.getBoundingClientRect()
    setParallax({
      x: ((event.clientX - bounds.left) / bounds.width - .5) * -14,
      y: ((event.clientY - bounds.top) / bounds.height - .5) * -8,
    })
  }

  return (
    <section className="hero-section" onMouseMove={handlePointerMove} onMouseLeave={() => setParallax({ x: 0, y: 0 })}>
      <AnimatePresence mode="sync">
        {backdrop && <motion.div key={featuredMovie.id} className="hero-backdrop" initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1.08, x: parallax.x, y: parallax.y }} exit={{ opacity: 0 }} transition={{ opacity: { duration: .8 }, scale: { duration: 16, ease: 'linear' }, x: { duration: .8 }, y: { duration: .8 } }} style={{ backgroundImage: `url(${backdrop})` }} aria-hidden="true" />}
      </AnimatePresence>
      <CinematicBackground />
      <div className="hero-orbit orbit-one" aria-hidden="true" />
      <div className="hero-orbit orbit-two" aria-hidden="true" />
      <div className="hero-beam" aria-hidden="true" />
      <div className="hero-copy">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay: .12 }}>
          <p className="eyebrow"><span className="signal-dot" /> THE CINEMATIC ARCHIVE</p>
          <h1>{featuredMovie?.title || 'Featured archive signal'}</h1>
          {featuredMovie && <>
            <div className="hero-metadata">
              {featuredMovie.year && <span>{featuredMovie.year}</span>}
              {featuredMovie.genres?.length > 0 && <span>{featuredMovie.genres.slice(0, 3).join(' · ')}</span>}
              {featuredMovie.runtime && <span>{featuredMovie.runtime} min</span>}
            </div>
            {(featuredMovie.tmdbRating !== null && featuredMovie.tmdbRating !== undefined) || (featuredMovie.imdbRating !== null && featuredMovie.imdbRating !== undefined) ? <div className="hero-ratings">
              {featuredMovie.tmdbRating !== null && featuredMovie.tmdbRating !== undefined && <span><b>TMDB</b> {Number(featuredMovie.tmdbRating).toFixed(1)}</span>}
              {featuredMovie.imdbRating !== null && featuredMovie.imdbRating !== undefined && <span><b>IMDb</b> {Number(featuredMovie.imdbRating).toFixed(1)}</span>}
            </div> : null}
          </>}
          {featuredMovie?.overview && <p className="hero-description">{featuredMovie.overview}</p>}
          <div className="hero-actions">
            {featuredMovie?.id && <Link className="button button-primary" to={`/movie/${featuredMovie.id}`}>Explore film <span>↘</span></Link>}
            {featuredMovie?.id && <Link className="button button-quiet" to={`/movie/${featuredMovie.id}`}>Watch order</Link>}
          </div>
        </motion.div>
      </div>
      <div className="hero-rail"><span className="hero-rail-index">01</span><span>FEATURED IN THE ARCHIVE</span><span>{featuredMovie?.year || '—'}</span><span>{featuredMovie?.genres?.slice(0, 3).join(' · ') || '—'}</span><span>{featuredMovie?.tmdbRating !== null && featuredMovie?.tmdbRating !== undefined ? `TMDB ${Number(featuredMovie.tmdbRating).toFixed(1)}` : '—'}</span><span>{movieCount ? `${movieCount} indexed stories` : 'Archive loading'}</span></div>
      <div className="scroll-mark">SCROLL TO DISCOVER <span>↓</span></div>
    </section>
  )
}
