export default function MovieDetailSkeleton() {
  return <main className="route-page movie-detail-page movie-detail-skeleton" aria-label="Loading movie details">
    <div className="back-link skeleton-line skeleton-short" />
    <div className="movie-detail-layout"><div className="movie-detail-poster skeleton-poster" /><div className="movie-detail-content"><div className="skeleton-line skeleton-short" /><div className="skeleton-line skeleton-title" /><div className="skeleton-line skeleton-wide" /><div className="skeleton-line skeleton-wide" /><div className="skeleton-line skeleton-overview" /><div className="skeleton-line skeleton-overview" /><div className="skeleton-line skeleton-short" /></div></div>
  </main>
}
