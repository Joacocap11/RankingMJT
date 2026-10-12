export interface Monster {
  id: number
  nickname: string
  flavor: string
  rank_position: number
  would_buy_again: boolean
  /** number from the API; may be a numeric string if a Decimal is serialized as text. Use toRating(). */
  rating: number | string | null
  image_path: string | null
  thumbnail_path: string | null
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
  rating: number | null
  notes: string | null
}

/** Payload accepted by PUT /api/v1/monsters/{id} — all fields optional/partial. */
export interface MonsterUpdateInput {
  nickname?: string
  flavor?: string
  rank_position?: number
  would_buy_again?: boolean
  /** null clears the rating; omit to leave it unchanged. */
  rating?: number | null
  notes?: string | null
}

export interface Beer {
  id: number
  brand: string
  name: string
  rank_position: number
  would_buy_again: boolean
  /** number from the API; may be a numeric string if a Decimal is serialized as text. Use toRating(). */
  rating: number | string | null
  image_path: string | null
  thumbnail_path: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

/** Payload accepted by POST /api/v1/beers */
export interface BeerCreateInput {
  brand: string
  name: string
  rank_position: number
  would_buy_again: boolean
  rating: number | null
  notes: string | null
}

/** Payload accepted by PUT /api/v1/beers/{id} — all fields optional/partial. */
export interface BeerUpdateInput {
  brand?: string
  name?: string
  rank_position?: number
  would_buy_again?: boolean
  /** null clears the rating; omit to leave it unchanged. */
  rating?: number | null
  notes?: string | null
}

export interface Alfajor {
  id: number
  brand: string
  name: string
  rank_position: number
  would_buy_again: boolean
  /** number from the API; may be a numeric string if a Decimal is serialized as text. Use toRating(). */
  rating: number | string | null
  image_path: string | null
  thumbnail_path: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

/** Payload accepted by POST /api/v1/alfajores */
export interface AlfajorCreateInput {
  brand: string
  name: string
  rank_position: number
  would_buy_again: boolean
  rating: number | null
  notes: string | null
}

/** Payload accepted by PUT /api/v1/alfajores/{id} — all fields optional/partial. */
export interface AlfajorUpdateInput {
  brand?: string
  name?: string
  rank_position?: number
  would_buy_again?: boolean
  /** null clears the rating; omit to leave it unchanged. */
  rating?: number | null
  notes?: string | null
}
