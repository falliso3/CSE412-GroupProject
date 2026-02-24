import { useEffect, useMemo, useState } from 'react'
import './App.css'
//Supabase call stuff
import { supabaseConfigStatus, supabaseSelectAll } from './lib/supabaseClient'
import {
  CATALOG_CACHE_KEY,
  CATALOG_CACHE_VERSION,
  CARD_SOURCE_TABLES,
  initialDecks,
  initialOwnedCards,
  MASTER_CARD_SELECT,
  MAX_VISIBLE_RESULTS,
  nextDeckIds,
  users,
} from './constants/appData'
import { cardCompletenessScore, normalizeCardRow } from './utils/catalogUtils'
import TopBar from './components/TopBar'
import StatsGrid from './components/StatsGrid'
import CollectionPanel from './components/CollectionPanel'
import DeckPanel from './components/DeckPanel'
import BackendConfigPanel from './components/BackendConfigPanel'

function App() {
  //State variables. PLEASE DO NOT TOUCH UNLESS YOU COMMENT WHAT YOU'VE CHANGED DIRECTLY IN THE CODE

  //User related state variables
  const [activeUserId, setActiveUserId] = useState(1)
  const [cardCatalog, setCardCatalog] = useState([])
  const [ownedCardsByUser, setOwnedCardsByUser] = useState(initialOwnedCards)
  const [decksByUser, setDecksByUser] = useState(initialDecks)
  const [deckIdCursorByUser, setDeckIdCursorByUser] = useState(nextDeckIds)

  //Display/filter/search state variables
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [setFilter, setSetFilter] = useState('all')
  const [seriesFilter, setSeriesFilter] = useState('all')
  const [sortBy, setSortBy] = useState('release-desc')

  //Aggregate card/deck display state variables
  const [activeDeckId, setActiveDeckId] = useState(1)
  const [newDeckName, setNewDeckName] = useState('')
  const [syncMessage, setSyncMessage] = useState(
    supabaseConfigStatus.ready
      ? 'loading card catalog from Supabase...'
      : 'Supabase not configured - catalog unavailable',
  )
  const [catalogSource, setCatalogSource] = useState(supabaseConfigStatus.ready ? 'supabase' : 'none')
  const [tableLoadDetails, setTableLoadDetails] = useState([])

  //Save compute power by not searching after every keystroke
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 200)
    return () => clearTimeout(handle)
  }, [search])

  const activeUser = users.find((u) => u.userId === activeUserId)
  const activeUserOwned = useMemo(
    () => ownedCardsByUser[activeUserId] ?? {},
    [ownedCardsByUser, activeUserId],
  )
  const activeUserDecks = useMemo(() => decksByUser[activeUserId] ?? [], [decksByUser, activeUserId])
  const activeDeck = useMemo(
    () => activeUserDecks.find((deck) => deck.deckId === activeDeckId) ?? null,
    [activeUserDecks, activeDeckId],
  )

  const setOptions = useMemo(() => [...new Set(cardCatalog.map((card) => card.set))].sort(), [cardCatalog])
  const seriesOptions = useMemo(
    () => [...new Set(cardCatalog.map((card) => card.series))].sort(),
    [cardCatalog],
  )

  const searchableCatalog = useMemo(
    () =>
      cardCatalog.map((card) => ({
        ...card,
        _nameLc: card.name.toLowerCase(),
        _idLc: card.cardId.toLowerCase(),
      })),
    [cardCatalog],
  )

  const visibleCards = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase()

    const filtered = searchableCatalog.filter((card) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        card._nameLc.includes(normalizedSearch) ||
        card._idLc.includes(normalizedSearch)

      const matchesSet = setFilter === 'all' || card.set === setFilter
      const matchesSeries = seriesFilter === 'all' || card.series === seriesFilter

      return matchesSearch && matchesSet && matchesSeries
    })

    //Sorted cards
    return [...filtered]
      .sort((a, b) => {
        if (sortBy === 'release-asc') {
          return a.releaseDate.localeCompare(b.releaseDate)
        }
        if (sortBy === 'name-asc') {
          return a.name.localeCompare(b.name)
        }
        if (sortBy === 'name-desc') {
          return b.name.localeCompare(a.name)
        }
        return b.releaseDate.localeCompare(a.releaseDate)
      })
      .slice(0, MAX_VISIBLE_RESULTS)
  }, [searchableCatalog, debouncedSearch, setFilter, seriesFilter, sortBy])

  const wishlistCount = Object.values(activeUserOwned).filter((entry) => entry?.isWished).length
  const totalOwnedCards = Object.values(activeUserOwned).reduce(
    (sum, entry) => sum + (Number.isFinite(entry?.amtOwned) ? entry.amtOwned : 0),
    0,
  )

  const totalDeckCards = useMemo(() => {
    if (!activeDeck) {
      return 0
    }
    return Object.values(activeDeck.cards).reduce((sum, amount) => sum + amount, 0)
  }, [activeDeck])

  const canValidateDeck = useMemo(() => {
    if (!activeDeck) {
      return false
    }
    if (totalDeckCards === 0 || totalDeckCards > 60) {
      return false
    }
    return Object.entries(activeDeck.cards).every(([cardId, amount]) => {
      const owned = activeUserOwned[cardId]?.amtOwned ?? 0
      return amount <= 4 && amount <= owned
    })
  }, [activeDeck, activeUserOwned, totalDeckCards])

  //Load cards from Supabase and cache a successful catalog snapshot
  useEffect(() => {
    if (!supabaseConfigStatus.ready) {
      return
    }

    let cancelled = false

    async function loadCatalogFromSupabase() {
      try {
        setSyncMessage('loading card catalog from Supabase...')
        try {
          const cached = localStorage.getItem(CATALOG_CACHE_KEY)
          if (cached) {
            const parsed = JSON.parse(cached)
            if (
              parsed?.version === CATALOG_CACHE_VERSION &&
              parsed?.source === 'supabase' &&
              Array.isArray(parsed.cards) &&
              parsed.cards.length > 0
            ) {
              setCardCatalog(parsed.cards)
              setSyncMessage(`loaded ${parsed.cards.length} cached cards, refreshing...`)
            }
          }
        } catch {
          //Ignore cache parse failures. Move onto network fetch
        }

        const tableResults = await Promise.all(
          CARD_SOURCE_TABLES.map(async ({ table, fallbackSupertype }) => {
            try {
              const rows = await supabaseSelectAll(table, {
                select: MASTER_CARD_SELECT,
                pageSize: 500,
                maxPages: 100,
              })
              return { table, fallbackSupertype, rows, error: null }
            } catch (error) {
              return { table, fallbackSupertype, rows: [], error }
            }
          }),
        )

        if (cancelled) {
          return
        }

        //Get data from Supabase
        setTableLoadDetails(
          tableResults.map((result) => ({
            table: result.table,
            rows: result.rows.length,
            error: result.error ? String(result.error.message ?? result.error) : '',
          })),
        )

        //Can be used to log and debug if needed later
        const errors = tableResults.filter((result) => result.error)
        const normalized = []
        tableResults.forEach(({ rows, fallbackSupertype }) => {
          rows.forEach((row) => {
            const nextCard = normalizeCardRow(row, fallbackSupertype)
            if (nextCard) {
              normalized.push(nextCard)
            }
          })
        })

        const dedupedByCardId = new Map()
        normalized.forEach((card) => {
          const existing = dedupedByCardId.get(card.cardId)
          if (!existing || cardCompletenessScore(card) > cardCompletenessScore(existing)) {
            dedupedByCardId.set(card.cardId, card)
          }
        })

        //Get the loaded cards and display upon retrieving from database
        const loadedCards = [...dedupedByCardId.values()]
        if (loadedCards.length > 0) {
          setCardCatalog(loadedCards)
          setSearch('')
          setDebouncedSearch('')
          setSetFilter('all')
          setSeriesFilter('all')
          setCatalogSource('supabase')
          try {
            localStorage.setItem(
              CATALOG_CACHE_KEY,
              JSON.stringify({
                version: CATALOG_CACHE_VERSION,
                source: 'supabase',
                savedAt: Date.now(),
                cards: loadedCards,
              }),
            )
          } catch {
            //Hopefully this never happens because I don't want to implement error handling
          }
        } else {
          setCardCatalog([])
          setCatalogSource('supabase')
        }

        //If errors appear
        if (errors.length > 0) {
          setSyncMessage(
            `loaded ${loadedCards.length} cards (${errors.length} table${errors.length === 1 ? '' : 's'} failed)`,
          )
        } 
        //If load from database is successful
        else {
          setSyncMessage(`loaded ${loadedCards.length} cards from Supabase`)
        }
      } catch (error) {
        if (!cancelled) {
          setSyncMessage(`catalog load failed: ${error.message}`)
          setCatalogSource('supabase')
          setCardCatalog([])
        }
      }
    }

    loadCatalogFromSupabase()

    return () => {
      cancelled = true
    }
  }, [])

  //Write owned card counts into local app state for current active user
  function updateOwnedCard(cardId, nextAmount) {
    const safeAmount = Number.isFinite(nextAmount) ? Math.max(0, nextAmount) : 0

    setOwnedCardsByUser((prev) => {
      const userOwned = { ...(prev[activeUserId] ?? {}) }
      const current = userOwned[cardId] ?? { amtOwned: 0, isWished: false }
      userOwned[cardId] = { ...current, amtOwned: safeAmount }
      return { ...prev, [activeUserId]: userOwned }
    })
  }

  //Toggle wishlist state in local app state for the user
  function toggleWishlist(cardId, checked) {
    setOwnedCardsByUser((prev) => {
      const userOwned = { ...(prev[activeUserId] ?? {}) }
      const current = userOwned[cardId] ?? { amtOwned: 0, isWished: false }
      userOwned[cardId] = { ...current, isWished: checked }
      return { ...prev, [activeUserId]: userOwned }
    })
  }

  //Obviously creates the deck for a user
  function createDeck() {
    const trimmedName = newDeckName.trim()
    if (!trimmedName) {
      return
    }

    const nextDeckId = deckIdCursorByUser[activeUserId] ?? 1
    const nextDeck = {
      deckId: nextDeckId,
      deckName: trimmedName,
      cards: {},
    }

    setDecksByUser((prev) => {
      const userDecks = prev[activeUserId] ?? []
      return { ...prev, [activeUserId]: [...userDecks, nextDeck] }
    })

    setDeckIdCursorByUser((prev) => ({
      ...prev,
      [activeUserId]: nextDeckId + 1,
    }))

    setActiveDeckId(nextDeckId)
    setNewDeckName('')
  }

  function deleteDeck(deckId) {
    setDecksByUser((prev) => {
      const userDecks = prev[activeUserId] ?? []
      const nextDecks = userDecks.filter((deck) => deck.deckId !== deckId)

      if (nextDecks.length === 0) {
        setActiveDeckId(0)
      } else if (deckId === activeDeckId) {
        setActiveDeckId(nextDecks[0].deckId)
      }

      return { ...prev, [activeUserId]: nextDecks }
    })
  }

  function updateDeckCard(cardId, nextAmount) {
    if (!activeDeck) {
      return
    }

    const safeAmount = Number.isFinite(nextAmount) ? Math.max(0, Math.min(4, nextAmount)) : 0

    setDecksByUser((prev) => {
      const userDecks = [...(prev[activeUserId] ?? [])]
      const deckIndex = userDecks.findIndex((deck) => deck.deckId === activeDeck.deckId)
      if (deckIndex < 0) {
        return prev
      }

      const targetDeck = { ...userDecks[deckIndex], cards: { ...userDecks[deckIndex].cards } }

      if (safeAmount === 0) {
        delete targetDeck.cards[cardId]
      } else {
        targetDeck.cards[cardId] = safeAmount
      }

      userDecks[deckIndex] = targetDeck
      return { ...prev, [activeUserId]: userDecks }
    })
  }

  return (
    <main className="app-shell">
      <TopBar
        users={users}
        activeUserId={activeUserId}
        onChangeUser={(selectedUserId) => {
          setActiveUserId(selectedUserId)
          const nextDeck = (decksByUser[selectedUserId] ?? [])[0]
          setActiveDeckId(nextDeck ? nextDeck.deckId : 0)
        }}
      />

      <StatsGrid
        activeUser={activeUser}
        totalOwnedCards={totalOwnedCards}
        wishlistCount={wishlistCount}
        deckCount={activeUserDecks.length}
      />

      <CollectionPanel
        search={search}
        onSearchChange={setSearch}
        setFilter={setFilter}
        onSetFilterChange={setSetFilter}
        seriesFilter={seriesFilter}
        onSeriesFilterChange={setSeriesFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        setOptions={setOptions}
        seriesOptions={seriesOptions}
        visibleCards={visibleCards}
        activeUserOwned={activeUserOwned}
        onUpdateOwnedCard={updateOwnedCard}
        onToggleWishlist={toggleWishlist}
      />

      <DeckPanel
        activeDeck={activeDeck}
        activeDeckId={activeDeckId}
        activeUserDecks={activeUserDecks}
        newDeckName={newDeckName}
        onChangeDeckId={setActiveDeckId}
        onChangeNewDeckName={setNewDeckName}
        onCreateDeck={createDeck}
        onDeleteDeck={() => activeDeck && deleteDeck(activeDeck.deckId)}
        totalDeckCards={totalDeckCards}
        canValidateDeck={canValidateDeck}
        visibleCards={visibleCards}
        activeUserOwned={activeUserOwned}
        onUpdateDeckCard={updateDeckCard}
      />

      <BackendConfigPanel
        supabaseUrl={import.meta.env.VITE_SUPABASE_URL}
        anonConfigured={Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)}
        clientReady={supabaseConfigStatus.ready}
        clientReason={supabaseConfigStatus.reason}
        catalogSource={catalogSource}
        syncMessage={syncMessage}
        tableLoadDetails={tableLoadDetails}
      />
    </main>
  )
}

export default App
