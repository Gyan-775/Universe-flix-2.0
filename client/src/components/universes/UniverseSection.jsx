import { useApp } from '../../context/AppContext'

export default function UniverseSection() {
  const { universes, selectedUniverse, setSelectedUniverse } = useApp()
  return (
    <div className="universe-strip" aria-label="Universe filters">
      <button className={!selectedUniverse ? 'universe-chip active' : 'universe-chip'} onClick={() => setSelectedUniverse(null)} type="button">All worlds</button>
      {universes.map((universe) => <button className={selectedUniverse === universe.id ? 'universe-chip active' : 'universe-chip'} key={universe.id} onClick={() => setSelectedUniverse(universe.id)} type="button">{universe.name}</button>)}
    </div>
  )
}
