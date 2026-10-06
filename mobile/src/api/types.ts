// Mirrors the backend MonsterOut contract (see backend API docs, /api/v1/monsters).
export interface Monster {
  id: number;
  nickname: string;
  flavor: string;
  rank_position: number;
  would_buy_again: boolean;
  image_path: string | null;
  thumbnail_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MonsterCreateInput {
  nickname: string;
  flavor: string;
  rank_position: number;
  would_buy_again?: boolean;
  notes?: string | null;
}

// All fields optional/partial, matching PUT /monsters/{id} semantics.
export interface MonsterUpdateInput {
  nickname?: string;
  flavor?: string;
  rank_position?: number;
  would_buy_again?: boolean;
  notes?: string | null;
}

// Mirrors the backend BeerOut contract (see backend API docs, /api/v1/beers).
export interface Beer {
  id: number;
  brand: string;
  name: string;
  rank_position: number;
  would_buy_again: boolean;
  image_path: string | null;
  thumbnail_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BeerCreateInput {
  brand: string;
  name: string;
  rank_position: number;
  would_buy_again?: boolean;
  notes?: string | null;
}

// All fields optional/partial, matching PUT /beers/{id} semantics.
export interface BeerUpdateInput {
  brand?: string;
  name?: string;
  rank_position?: number;
  would_buy_again?: boolean;
  notes?: string | null;
}

export interface PickedImage {
  uri: string;
  name: string;
  type: string;
}
