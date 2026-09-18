import { useCallback, useEffect, useState } from 'react'
import { getMovieById } from '../services/movieService'

export function useMovieDetails(id) {
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    try {
      const nextMovie = await getMovieById(id, { signal: controller.signal })
      setMovie(nextMovie)
      return nextMovie
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError)
      throw requestError
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setLoading(true)
    setError(null)
    getMovieById(id, { signal: controller.signal })
      .then((nextMovie) => { if (active) setMovie(nextMovie) })
      .catch((requestError) => { if (active && requestError.name !== 'AbortError') setError(requestError) })
      .finally(() => { if (active && !controller.signal.aborted) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [id])

  return { movie, loading, error, refetch }
}
