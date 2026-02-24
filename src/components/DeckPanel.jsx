import { cardImageOrPlaceholder } from '../utils/catalogUtils'

//Deck management UI that holds the deck selector and individual card info
export default function DeckPanel({
  activeDeck,
  activeDeckId,
  activeUserDecks,
  newDeckName,
  onChangeDeckId,
  onChangeNewDeckName,
  onCreateDeck,
  onDeleteDeck,
  totalDeckCards,
  canValidateDeck,
  visibleCards,
  activeUserOwned,
  onUpdateDeckCard,
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h3>Deck Creation</h3>
        <p>Create decks of up to 60 cards with per-card max of 4 copies.</p>
      </div>

      <div className="deck-toolbar">
        <label className="inline-control" htmlFor="deck-select">
          Active Deck
          <select id="deck-select" value={activeDeckId} onChange={(event) => onChangeDeckId(Number(event.target.value))}>
            {activeUserDecks.length === 0 ? <option value="0">No decks yet</option> : null}
            {activeUserDecks.map((deck) => (
              <option key={deck.deckId} value={deck.deckId}>
                {deck.deckName}
              </option>
            ))}
          </select>
        </label>

        <label className="inline-control" htmlFor="new-deck-name">
          New Deck Name
          <input
            id="new-deck-name"
            value={newDeckName}
            placeholder="Deck title"
            onChange={(event) => onChangeNewDeckName(event.target.value)}
          />
        </label>

        <button type="button" onClick={onCreateDeck}>
          Create Deck
        </button>

        <button type="button" className="danger" disabled={!activeDeck} onClick={onDeleteDeck}>
          Delete Deck
        </button>
      </div>

      <div className="deck-status-row">
        <p>
          Deck Size: <strong>{totalDeckCards}</strong> / 60
        </p>
        <p className={canValidateDeck ? 'valid' : 'invalid'}>
          {canValidateDeck ? 'Deck can be validated.' : 'Deck invalid: exceed limits or missing owned copies.'}
        </p>
      </div>

      {activeDeck ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Card</th>
                <th>Owned</th>
                <th>In Deck</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleCards.map((card) => {
                const owned = activeUserOwned[card.cardId]?.amtOwned ?? 0
                const inDeck = activeDeck.cards[card.cardId] ?? 0
                const exceedsOwned = inDeck > owned
                return (
                  <tr key={card.cardId} className={exceedsOwned ? 'muted-row' : ''}>
                    <td>
                      <img
                        className="card-thumb"
                        src={cardImageOrPlaceholder(card)}
                        alt={`${card.name} card`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.src = '/placeholder-card.svg'
                        }}
                      />
                    </td>
                    <td>
                      <p className="card-title">{card.name}</p>
                      <p className="card-sub">{card.cardId}</p>
                    </td>
                    <td>{owned}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        value={inDeck}
                        onChange={(event) => onUpdateDeckCard(card.cardId, Number(event.target.value))}
                      />
                    </td>
                    <td>{exceedsOwned ? 'Not owned enough (greyed out)' : 'Ready'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-state">Create a deck to start adding cards.</p>
      )}
    </section>
  )
}
