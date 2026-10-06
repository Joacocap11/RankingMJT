import { useState } from 'react'
import type { Beer } from './types'
import { beerImageUrl, beerThumbnailUrl } from './api'
import ImageLightbox from './ImageLightbox'

interface BeerCardProps {
  beer: Beer
  onEdit: (beer: Beer) => void
  onDelete: (beer: Beer) => void
}

export default function BeerCard({ beer, onEdit, onDelete }: BeerCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const thumbnailUrl = beerThumbnailUrl(beer)

  return (
    <article className="monster-card">
      <div className="monster-card-rank">#{beer.rank_position}</div>

      <div className="monster-card-image">
        {thumbnailUrl ? (
          <button
            type="button"
            className="monster-card-image-button"
            onClick={() => setViewerOpen(true)}
            aria-label={`Ver imagen ampliada de ${beer.brand}`}
          >
            <img src={thumbnailUrl} alt={beer.brand} loading="lazy" />
          </button>
        ) : (
          <div className="monster-card-image-placeholder" aria-label="Sin foto">
            🍺
          </div>
        )}
      </div>

      {viewerOpen && beer.image_path && (
        <ImageLightbox
          src={beerImageUrl(beer.image_path)}
          alt={beer.brand}
          onClose={() => setViewerOpen(false)}
        />
      )}

      <div className="monster-card-body">
        <h3>{beer.brand}</h3>
        <p className="monster-card-flavor">{beer.name}</p>
        <span
          className={
            beer.would_buy_again
              ? 'badge badge-buy-again'
              : 'badge badge-no-buy-again'
          }
        >
          {beer.would_buy_again ? 'Compraría de nuevo' : 'No compraría'}
        </span>
        {beer.notes && <p className="monster-card-notes">{beer.notes}</p>}
      </div>

      <div className="monster-card-actions">
        <button type="button" onClick={() => onEdit(beer)}>
          Editar
        </button>
        <button type="button" className="danger" onClick={() => onDelete(beer)}>
          Eliminar
        </button>
      </div>
    </article>
  )
}
