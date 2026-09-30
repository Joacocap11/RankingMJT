import { useState } from 'react'
import type { Monster } from './types'
import { monsterImageUrl, monsterThumbnailUrl } from './api'
import ImageLightbox from './ImageLightbox'

interface MonsterCardProps {
  monster: Monster
  onEdit: (monster: Monster) => void
  onDelete: (monster: Monster) => void
}

export default function MonsterCard({ monster, onEdit, onDelete }: MonsterCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const thumbnailUrl = monsterThumbnailUrl(monster)

  return (
    <article className="monster-card">
      <div className="monster-card-rank">#{monster.rank_position}</div>

      <div className="monster-card-image">
        {thumbnailUrl ? (
          <button
            type="button"
            className="monster-card-image-button"
            onClick={() => setViewerOpen(true)}
            aria-label={`Ver imagen ampliada de ${monster.nickname}`}
          >
            <img src={thumbnailUrl} alt={monster.nickname} loading="lazy" />
          </button>
        ) : (
          <div className="monster-card-image-placeholder" aria-label="Sin foto">
            🥫
          </div>
        )}
      </div>

      {viewerOpen && monster.image_path && (
        <ImageLightbox
          src={monsterImageUrl(monster.image_path)}
          alt={monster.nickname}
          onClose={() => setViewerOpen(false)}
        />
      )}

      <div className="monster-card-body">
        <h3>{monster.nickname}</h3>
        <p className="monster-card-flavor">{monster.flavor}</p>
        <span
          className={
            monster.would_buy_again
              ? 'badge badge-buy-again'
              : 'badge badge-no-buy-again'
          }
        >
          {monster.would_buy_again ? 'Compraría de nuevo' : 'No compraría'}
        </span>
        {monster.notes && <p className="monster-card-notes">{monster.notes}</p>}
      </div>

      <div className="monster-card-actions">
        <button type="button" onClick={() => onEdit(monster)}>
          Editar
        </button>
        <button type="button" className="danger" onClick={() => onDelete(monster)}>
          Eliminar
        </button>
      </div>
    </article>
  )
}
