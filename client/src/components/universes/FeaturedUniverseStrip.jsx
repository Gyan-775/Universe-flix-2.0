import { motion } from 'framer-motion'
import { Link } from '../../router'
import { useApp } from '../../context/AppContext'

export default function FeaturedUniverseStrip() {
  const { universes } = useApp()
  const featured = universes.filter((universe) => universe.featured)

  return (
    <section className="featured-universes" aria-label="Featured universes">
      <div className="featured-universes-heading"><p className="eyebrow">FEATURED UNIVERSES</p><span>CURATED DOORWAYS</span></div>
      {featured.length ? <div className="featured-universes-list">{featured.map((universe, index) => <motion.div key={universe.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04, duration: .35 }}><Link className="featured-universe-tile" to={`/universe/${universe.slug}`}><span>{universe.shortName || universe.name}</span><small>{universe.type}</small></Link></motion.div>)}</div> : <p className="universe-empty">No featured universe definitions are configured yet.</p>}
    </section>
  )
}
