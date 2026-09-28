export interface Monster {
  id: number
  nickname: string
  flavor: string
  rank_position: number
  would_buy_again: boolean
  image_path: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

/** Payload accepted by POST /api/v1/monsters */
export interface MonsterCreateInput {
  nickname: string
  flavor: string
  rank_position: number
  would_buy_again: boolean
  notes: string | null
}

/** Payload accepted by PUT /api/v1/monsters/{id} — all fields optional/partial. */
export interface MonsterUpdateInput {
  nickname?: string
  flavor?: string
  rank_position?: number
  would_buy_again?: boolean
  notes?: string | null
}
