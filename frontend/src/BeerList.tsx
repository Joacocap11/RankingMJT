import type { Beer } from './types'
import BeerCard from './BeerCard'

interface BeerListProps {
  title: string
  beers: Beer[]
  onEdit: (beer: Beer) => void
  onDelete: (beer: Beer) => void
}

export default function BeerList({ title, beers, onEdit, onDelete }: BeerListProps) {
  return (
    <section className="monster-section">
      <h2 className="monster-section-title">{title}</h2>
      {beers.length === 0 ? (
        <p className="monster-section-empty">No hay cervezas en esta sección.</p>
      ) : (
        <div className="monster-grid">
          {beers.map((beer) => (
            <BeerCard key={beer.id} beer={beer} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  )
}
