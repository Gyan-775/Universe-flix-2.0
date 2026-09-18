import { Link } from '../router'
import { useApp } from '../context/AppContext'
import { useSearch } from '../hooks/useSearch'
import MovieGrid from '../components/movies/MovieGrid'

export default function SearchPage() {
  const { searchQuery, setSearchQuery } = useApp()
  const { results, loading, error, totalResults } = useSearch(searchQuery)

  return (
    <main
    className="route-page search-page"
    style={
        results[0]?.backdropPath
            ? { '--search-backdrop': `url(${backdropUrl(results[0].backdropPath)})` }
            : undefined
    }
>
      <Link className="back-link" to="/">← Return to archive</Link>
      <p className="eyebrow">SEARCH THE ARCHIVE</p>
      <h1>Find a story</h1>
      <input className="route-search" autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Movie, actor, director, genre..." />
      {error ? <div className="archive-error"><strong>Search connection failed</strong><span>{error.message}</span></div> : <><p className="archive-count">{loading ? 'Searching archive' : totalResults ? `${totalResults} results` : ''}</p><MovieGrid movies={results} isLoading={loading} /></>}
    </main>
  )
}
