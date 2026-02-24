//Return first nonempty val from a row for a provided key alias
export function firstDefined(row, keys, fallback = '') {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value
    }
  }
  return fallback
}

//Maps raw Supabase row data into card shape used by UI tables
export function normalizeCardRow(row, fallbackSupertype) {
  const cardId = String(
    firstDefined(row, ['card_id', 'id', 'cardid', 'cardId', 'pk', 'uuid'], ''),
  ).trim()
  const name = String(firstDefined(row, ['name', 'card_name', 'pokemon_name'], 'Unknown Card')).trim()

  if (!cardId || !name) {
    return null
  }

  const releaseDateRaw = String(
    firstDefined(row, ['release_date', 'set_release_date', 'date_released', 'releaseDate'], ''),
  ).trim()

  //Return data includes all relevant info of the card
  return {
    cardId,
    name,
    set: String(firstDefined(row, ['set', 'set_name', 'setName'], 'Unknown Set')).trim(),
    series: String(firstDefined(row, ['series', 'set_series', 'series_name'], 'Unknown Series')).trim(),
    publisher: String(firstDefined(row, ['publisher', 'brand'], 'Unknown Publisher')).trim(),
    generation: Number(firstDefined(row, ['generation', 'gen'], 0)) || 0,
    releaseDate: releaseDateRaw || '1900-01-01',
    artist: String(firstDefined(row, ['artist', 'illustrator'], 'Unknown Artist')).trim(),
    setNum: Number(firstDefined(row, ['set_num', 'set_number', 'number'], 0)) || 0,
    supertype: String(firstDefined(row, ['supertype', 'card_type', 'type'], fallbackSupertype ?? 'Unknown')).trim(),
    rarity: String(firstDefined(row, ['rarity'], 'Unknown')).trim(),
    hp: Number(firstDefined(row, ['hp'], 0)) || null,
    imageUrl: String(
      firstDefined(row, ['image_url', 'image', 'image_small', 'small_image'], '/placeholder-card.svg'),
    ).trim(),
  }
}

//Higher score -> basically a tiebreaker for card importance
export function cardCompletenessScore(card) {
  let score = 0
  if (card.set && card.set !== 'Unknown Set') score += 1
  if (card.series && card.series !== 'Unknown Series') score += 1
  if (card.supertype && card.supertype !== 'Unknown') score += 1
  if (card.rarity && card.rarity !== 'Unknown') score += 1
  if (card.artist && card.artist !== 'Unknown Artist') score += 1
  if (card.releaseDate && card.releaseDate !== '1900-01-01') score += 1
  if (card.setNum && card.setNum > 0) score += 1
  return score
}

//Generic no image placeholder
export function cardImageOrPlaceholder(card) {
  return card.imageUrl || '/placeholder-card.svg'
}
