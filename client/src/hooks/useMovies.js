import { useCallback, useEffect, useRef, useState } from 'react'
import { getMovies } from '../services/movieService'

export function useMovies(filters = {}) {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalResults, setTotalResults] = useState(0)
  const requestId = useRef(0)
  const filterKey = JSON.stringify(filters)

  const refetch = useCallback(async () => {
    const currentRequest = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const data = await getMovies({ ...filters, page: 1 })
      if (currentRequest !== requestId.current) return data.movies
      setMovies(data.movies)
      setPage(data.page)
      setTotalPages(data.totalPages)
      setTotalResults(data.totalResults)
      return data.movies
    } catch (requestError) {
      setError(requestError)
      throw requestError
    } finally {
      setLoading(false)
    }
  }, [filterKey])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const currentRequest = ++requestId.current

    async function loadMovies() {
      setLoading(true)
      setError(null)
      try {
        const data = await getMovies({ ...filters, page: 1, signal: controller.signal })
        if (active && currentRequest === requestId.current) {
          setMovies(data.movies)
          setPage(data.page)
          setTotalPages(data.totalPages)
          setTotalResults(data.totalResults)
        }
      } catch (requestError) {
        if (active && requestError.name !== 'AbortError') setError(requestError)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadMovies()
    return () => {
      active = false
      controller.abort()
    }
  }, [filterKey])

  const loadMore = useCallback(async () => {
    if (loading || page >= totalPages) return
    setLoading(true)
    try {
      const data = await getMovies({ ...filters, page: page + 1 })
      setMovies((current) => [...current, ...data.movies])
      setPage(data.page)
      setTotalPages(data.totalPages)
      setTotalResults(data.totalResults)
    } catch (requestError) {
      setError(requestError)
    } finally {
      setLoading(false)
    }
  }, [filterKey, loading, page, totalPages])

  return { movies, loading, error, page, totalPages, totalResults, refetch, loadMore }
}
