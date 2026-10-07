import { useState } from 'react'
import type { Alfajor } from './types'
import { alfajorImageUrl, alfajorThumbnailUrl } from './api'
import ImageLightbox from './ImageLightbox'

interface AlfajorCardProps {
  alfajor: Alfajor
  onEdit: (alfajor: Alfajor) => void
  onDelete: (alfajor: Alfajor) => void
}

export default function AlfajorCard({ alfajor, onEdit, onDelete }: AlfajorCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const thumbnailUrl = alfajorThumbnailUrl(alfajor)

  return (
    <article className="monster-card">
      <div className="monster-card-rank">#{alfajor.rank_position}</div>

      <div className="monster-card-image">
        {thumbnailUrl ? (
          <button
            type="button"
            className="monster-card-image-button"
            onClick={() => setViewerOpen(true)}
            aria-label={`Ver imagen ampliada de ${alfajor.brand}`}
          >
            <img src={thumbnailUrl} alt={alfajor.brand} loading="lazy" />
          </button>
        ) : (
          <div className="monster-card-image-placeholder" aria-label="Sin foto">
            🥮
          </div>
        )}
      </div>

      {viewerOpen && alfajor.image_path && (
        <ImageLightbox
          src={alfajorImageUrl(alfajor.image_path)}
          alt={alfajor.brand}
          onClose={() => setViewerOpen(false)}
        />
      )}

      <div className="monster-card-body">
        <h3>{alfajor.brand}</h3>
        <p className="monster-card-flavor">{alfajor.name}</p>
        <span
          className={
            alfajor.would_buy_again
              ? 'badge badge-buy-again'
              : 'badge badge-no-buy-again'
          }
        >
          {alfajor.would_buy_again ? 'Compraría de nuevo' : 'No compraría'}
        </span>
        {alfajor.notes && <p className="monster-card-notes">{alfajor.notes}</p>}
      </div>

      <div className="monster-card-actions">
        <button type="button" onClick={() => onEdit(alfajor)}>
          Editar
        </button>
        <button type="button" className="danger" onClick={() => onDelete(alfajor)}>
          Eliminar
        </button>
      </div>
    </article>
  )
}
