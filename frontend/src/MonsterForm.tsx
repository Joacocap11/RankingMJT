import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, createMonster, updateMonster, uploadMonsterImage } from './api'
import type { Monster } from './types'

interface MonsterFormProps {
  mode: 'create' | 'edit'
  monster?: Monster
  /** Total monster count, used to compute the default create position (count + 1). */
  currentCount: number
  onSaved: (monster: Monster) => void
  onCancel: () => void
}

export default function MonsterForm({
  mode,
  monster,
  currentCount,
  onSaved,
  onCancel,
}: MonsterFormProps) {
  const [nickname, setNickname] = useState(monster?.nickname ?? '')
  const [flavor, setFlavor] = useState(monster?.flavor ?? '')
  const [rankPosition, setRankPosition] = useState(
    monster?.rank_position ?? currentCount + 1,
  )
  const [wouldBuyAgain, setWouldBuyAgain] = useState(
    monster?.would_buy_again ?? true,
  )
  const [notes, setNotes] = useState(monster?.notes ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rankChanged = mode === 'edit' && monster !== undefined && rankPosition !== monster.rank_position
  const showShiftNote = mode === 'create' || rankChanged

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (nickname.trim().length === 0) {
      setError('El apodo es obligatorio.')
      return
    }
    if (flavor.trim().length === 0) {
      setError('El sabor es obligatorio.')
      return
    }
    if (!Number.isInteger(rankPosition) || rankPosition <= 0) {
      setError('La posición debe ser un entero mayor que 0.')
      return
    }

    setSubmitting(true)
    try {
      let saved: Monster
      if (mode === 'create') {
        saved = await createMonster({
          nickname: nickname.trim(),
          flavor: flavor.trim(),
          rank_position: rankPosition,
          would_buy_again: wouldBuyAgain,
          notes: notes.trim().length > 0 ? notes.trim() : null,
        })
      } else {
        if (!monster) throw new Error('Missing monster to edit')
        saved = await updateMonster(monster.id, {
          nickname: nickname.trim(),
          flavor: flavor.trim(),
          rank_position: rankPosition,
          would_buy_again: wouldBuyAgain,
          notes: notes.trim().length > 0 ? notes.trim() : null,
        })
      }

      if (file) {
        saved = await uploadMonsterImage(saved.id, file)
      }

      onSaved(saved)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Error inesperado guardando el monster.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="monster-form" onSubmit={handleSubmit}>
      <h2>{mode === 'create' ? 'Nuevo Monster' : `Editar #${monster?.rank_position}`}</h2>

      <label className="field">
        <span>Apodo *</span>
        <input
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>Sabor *</span>
        <input
          value={flavor}
          onChange={(event) => setFlavor(event.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>Posición *</span>
        <input
          type="number"
          min={1}
          value={rankPosition}
          onChange={(event) => setRankPosition(Number(event.target.value))}
          required
        />
      </label>
      {showShiftNote && (
        <p className="field-note">
          Esta posición moverá (desplazará) el resto de los monsters existentes.
        </p>
      )}

      <label className="field field-checkbox">
        <input
          type="checkbox"
          checked={wouldBuyAgain}
          onChange={(event) => setWouldBuyAgain(event.target.checked)}
        />
        <span>Compraría de nuevo</span>
      </label>

      <label className="field">
        <span>Notas</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
        />
      </label>

      <label className="field">
        <span>Foto</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
