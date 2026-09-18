import { useEffect, useMemo, useState } from 'react'
import { Link } from '../router'
import Navbar from '../components/layout/Navbar'
import Hero from '../components/hero/Hero'
import MovieGrid from '../components/movies/MovieGrid'
import MovieRail from '../components/movies/MovieRail'
import FeaturedUniverseStrip from '../components/universes/FeaturedUniverseStrip'
import { useSearch } from '../hooks/useSearch'
import { useApp } from '../context/AppContext'
import { getHomepage, getHomeFeed } from '../services/homeService'

const emptyFeed = { movies: [], totalResults: 0 }

export default function Home() {
  const {
    movies: archiveMovies, loading: archiveLoading, error: archiveError, refetch,
    genres, searchQuery, setSearchQuery, selectedGenre, setSelectedGenre, selectedYear,
    setSelectedYear, selectedRating, setSelectedRating,
  } = useApp()
  const [home, setHome] = useState(null)
  const [homeLoading, setHomeLoading] = useState(true)
  const [homeError, setHomeError] = useState(null)
  const [trendWindow, setTrendWindow] = useState('week')
  const [trending, setTrending] = useState(emptyFeed)
  const { results: searchResults, loading: searchLoading, error: searchError, totalResults: searchTotalResults } = useSearch(searchQuery)
  const isSearching = searchQuery.trim().length >= 2
  const years = useMemo(() => [...new Set(archiveMovies.map((movie) => movie.year).filter(Boolean))].sort((a, b) => b - a), [archiveMovies])
  const shownMovies = isSearching ? searchResults : archiveMovies
  const shownCount = shownMovies.length
  const resultCount = isSearching ? searchTotalResults : archiveMovies.length

  async function loadHome() {
    setHomeLoading(true)
    setHomeError(null)
    try {
      const data = await getHomepage()
      setHome(data)
      setTrending(data.trending || emptyFeed)
    } catch (error) {
      setHomeError(error)
    } finally {
      setHomeLoading(false)
    }
  }

  useEffect(() => { loadHome() }, [])

  useEffect(() => {
    if (!home || trendWindow === 'week') return undefined
    const controller = new AbortController()
    getHomeFeed('trending', { window: trendWindow, signal: controller.signal }).then(setTrending).catch(() => {})
    return () => controller.abort()
  }, [trendWindow, home])

  const latest = home?.latest || emptyFeed
  const popular = home?.popular || emptyFeed
  const topRated = home?.topRated || emptyFeed
  const upcoming = home?.upcoming || emptyFeed

  return <main>
    <Navbar />
    <Hero movieCount={latest.movies.length} featuredMovie={home?.featured} />
    <div className="home-rails">
      <MovieRail eyebrow="LATEST FROM THE ARCHIVE" title="Latest Releases" subtitle="Fresh from the archive." movies={latest.movies} loading={homeLoading} error={homeError ? 'Latest releases unavailable.' : null} onRetry={loadHome} />
      <MovieRail eyebrow="MOST DISCOVERED" title="Popular Right Now" subtitle="What the archive is watching." movies={popular.movies} loading={homeLoading} error={homeError ? 'Popular movies unavailable.' : null} onRetry={loadHome} />
      <section className="home-rail-section trending-section"><div className="home-rail-heading"><div><p className="eyebrow">MOVING THROUGH THE ARCHIVE</p><h2>Trending {trendWindow === 'day' ? 'Today' : 'This Week'}</h2></div><div className="trend-toggle"><button className={trendWindow === 'day' ? 'active' : ''} type="button" onClick={() => setTrendWindow('day')}>Today</button><button className={trendWindow === 'week' ? 'active' : ''} type="button" onClick={() => setTrendWindow('week')}>This week</button></div></div><MovieRail eyebrow="" title="" movies={trending.movies} loading={homeLoading} hideHeading /></section>
    </div>
    <section id="archive" className="archive-section">
      <div className="section-heading"><div><p className="eyebrow">THE ARCHIVE</p><h2>Choose a doorway<span className="heading-mark">/</span></h2><p>Search the archive, then choose a universe to enter its world.</p></div><span className="archive-count">{archiveLoading || searchLoading ? 'LOADING ARCHIVE' : `${shownCount} SHOWN${resultCount ? ` · ${resultCount} AVAILABLE` : ''}`}</span></div>
      <div className="filter-row"><label htmlFor="archive-search">Search the archive</label><input id="archive-search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Title, actor, director, genre..." /><select value={selectedGenre || ''} onChange={(event) => setSelectedGenre(event.target.value || null)}><option value="">All genres</option>{genres.map((genre) => <option key={genre.id} value={genre.id}>{genre.name}</option>)}</select><select value={selectedYear || ''} onChange={(event) => setSelectedYear(event.target.value || null)}><option value="">All years</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select><select value={selectedRating || ''} onChange={(event) => setSelectedRating(event.target.value || null)}><option value="">Any rating</option><option value="8">8+ rating</option><option value="7">7+ rating</option><option value="6">6+ rating</option></select></div>
      <FeaturedUniverseStrip />
      {archiveError && !archiveMovies.length ? <div className="archive-error"><strong>Archive connection failed</strong><span>{archiveError.message}</span><button className="button button-primary" type="button" onClick={refetch}>Retry</button></div> : searchError ? <div className="archive-error"><strong>Search connection failed</strong><span>{searchError.message}</span></div> : <MovieGrid movies={shownMovies} isLoading={archiveLoading || searchLoading} />}
    </section>
    <div className="home-rails"><MovieRail eyebrow="HIGHLY RATED" title="Top Rated" subtitle="Films with staying power." movies={topRated.movies} loading={homeLoading} error={homeError ? 'Top rated movies unavailable.' : null} onRetry={loadHome} />{upcoming.movies.length > 0 && <MovieRail eyebrow="COMING SOON" title="Upcoming" subtitle="Stories on the horizon." movies={upcoming.movies} loading={homeLoading} />}</div>
    <section id="for-you" className="signal-section"><p className="eyebrow">PERSONAL SIGNAL</p><h2>Build your taste profile.</h2><p>Your recommendations will be grounded in your viewing history and preferences, not generic popularity.</p><Link className="button button-primary" to="/search">Start discovering</Link></section>
    <footer className="site-footer">UNIVERSE-FLIX · A living cinematic archive</footer>
  </main>
}
