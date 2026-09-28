import type { Monster } from './types'
import { monsterImageUrl } from './api'

interface MonsterCardProps {
  monster: Monster
  onEdit: (monster: Monster) => void
  onDelete: (monster: Monster) => void
}

export default function MonsterCard({ monster, onEdit, onDelete }: MonsterCardProps) {
  return (
    <article className="monster-card">
      <div className="monster-card-rank">#{monster.rank_position}</div>

      <div className="monster-card-image">
        {monster.image_path ? (
          <img src={monsterImageUrl(monster.image_path)} alt={monster.nickname} />
        ) : (
          <div className="monster-card-image-placeholder" aria-label="Sin foto">
            🥫
          </div>
        )}
      </div>

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
