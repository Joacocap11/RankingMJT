import type { Alfajor } from './types'
import AlfajorCard from './AlfajorCard'

interface AlfajorListProps {
  title: string
  alfajores: Alfajor[]
  onEdit: (alfajor: Alfajor) => void
  onDelete: (alfajor: Alfajor) => void
}

export default function AlfajorList({ title, alfajores, onEdit, onDelete }: AlfajorListProps) {
  return (
    <section className="monster-section">
      <h2 className="monster-section-title">{title}</h2>
      {alfajores.length === 0 ? (
        <p className="monster-section-empty">No hay alfajores en esta sección.</p>
      ) : (
        <div className="monster-grid">
          {alfajores.map((alfajor) => (
            <AlfajorCard key={alfajor.id} alfajor={alfajor} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  )
}
