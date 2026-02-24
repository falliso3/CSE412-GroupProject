//Static app defaults for local user/deck state

//NOTE: Add more test users here as needed. If site needs to be made dynamic, account for that with graders
//RETURN TO THIS LATER IF THAT'S THE CASE
export const users = [
  { userId: 1, username: 'felix', email: 'felix@example.com' },
  { userId: 2, username: 'miguel', email: 'miguel@example.com' },
]

export const initialOwnedCards = {}
export const initialDecks = {}
export const nextDeckIds = {
  1: 1,
  2: 1,
}

//Catalog settings for Supabase loading and rendering for the UI
export const CARD_SOURCE_TABLES = [{ table: 'master_card_list', fallbackSupertype: null }]
export const MASTER_CARD_SELECT =
  'card_id,set,series,publisher,generation,release_date,artist,name,set_num,supertype,rarity,image_url'
export const CATALOG_CACHE_KEY = 'pokemon_catalog_cache_v1'
export const CATALOG_CACHE_VERSION = 3
export const MAX_VISIBLE_RESULTS = 500
