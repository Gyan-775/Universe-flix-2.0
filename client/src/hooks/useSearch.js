import { useEffect, useRef, useState } from 'react'
import { searchMovies } from '../services/searchService'

export function useSearch(query) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalResults, setTotalResults] = useState(0)
  const latestQuery = useRef('')

  useEffect(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (normalizedQuery.length < 2) {
      latestQuery.current = ''
      setResults([])
      setLoading(false)
      setError(null)
      return undefined
    }
    if (normalizedQuery === latestQuery.current) return undefined
    latestQuery.current = normalizedQuery

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await searchMovies(normalizedQuery, { page: 1, signal: controller.signal })
        if (!controller.signal.aborted) {
          setResults(data.movies)
          setPage(data.page)
          setTotalPages(data.totalPages)
          setTotalResults(data.totalResults)
        }
      } catch (requestError) {
        if (!controller.signal.aborted) setError(requestError)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 300)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  return { results, loading, error, page, totalPages, totalResults }
}