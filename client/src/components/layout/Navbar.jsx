import { Link } from '../../router'

export default function Navbar() {
  return (
    <header className="site-nav">
      <Link className="wordmark" to="/">Universe-flix</Link>
      <nav aria-label="Primary navigation">
        <a href="#archive">Archive</a>
        <a href="#for-you">For you</a>
        <Link to="/search">Search</Link>
      </nav>
      <span className="nav-status"><i /> API READY</span>
    </header>
  )
}
