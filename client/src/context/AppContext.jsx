import { createContext, useContext, useEffect, useState } from 'react'
import { useMovies } from '../hooks/useMovies'
import { getFeaturedMovies } from '../services/movieService'
import { getGenres } from '../services/genreService'
import { getUniverses } from '../services/universeService'
import { ensureAnonymousSession } from '../services/sessionService'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [selectedUniverse, setSelectedUniverse] = useState(null)
  const [selectedGenre, setSelectedGenre] = useState(null)
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedRating, setSelectedRating] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [universes, setUniverses] = useState([])
  const [genres, setGenres] = useState([])
  const [featuredMovie, setFeaturedMovie] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [currentMovie, setCurrentMovie] = useState(null)
  const [tasteProfile, setTasteProfile] = useState(null)
  const [watchOrder, setWatchOrder] = useState([])
  const movieState = useMovies({ limit: 24, genre: selectedGenre, year: selectedYear, rating: selectedRating, universe: selectedUniverse })

  useEffect(() => {
    ensureAnonymousSession().catch(() => {})
    let active = true
    Promise.allSettled([getFeaturedMovies(), getUniverses(), getGenres()]).then(([featured, universeResult, genreResult]) => {
      if (!active) return
      if (featured.status === 'fulfilled') setFeaturedMovie(featured.value)
      if (universeResult.status === 'fulfilled') setUniverses(universeResult.value)
      if (genreResult.status === 'fulfilled') setGenres(genreResult.value)
    })
    return () => { active = false }
  }, [])

  const value = {
    ...movieState,
    movies: movieState.movies,
    filteredMovies: movieState.movies,
    universes,
    genres,
    featuredMovie,
    recommendations,
    selectedUniverse,
    selectedGenre,
    selectedYear,
    selectedRating,
    searchQuery,
    currentMovie,
    tasteProfile,
    watchOrder,
    loading: movieState.loading,
    isLoading: movieState.loading,
    setRecommendations,
    setSelectedUniverse,
    setSelectedGenre,
    setSelectedYear,
    setSelectedRating,
    setSearchQuery,
    setCurrentMovie,
    setTasteProfile,
    setWatchOrder,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
