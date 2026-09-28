import type { Monster } from './types'
import MonsterCard from './MonsterCard'

interface MonsterListProps {
  title: string
  monsters: Monster[]
  onEdit: (monster: Monster) => void
  onDelete: (monster: Monster) => void
}

export default function MonsterList({ title, monsters, onEdit, onDelete }: MonsterListProps) {
  return (
    <section className="monster-section">
      <h2 className="monster-section-title">{title}</h2>
      {monsters.length === 0 ? (
        <p className="monster-section-empty">No hay monsters en esta sección.</p>
      ) : (
        <div className="monster-grid">
          {monsters.map((monster) => (
            <MonsterCard
              key={monster.id}
              monster={monster}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  )
}
