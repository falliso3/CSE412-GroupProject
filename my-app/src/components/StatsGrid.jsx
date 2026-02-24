//Summary cards for active user collection metrics and deck metrics
export default function StatsGrid({ activeUser, totalOwnedCards, wishlistCount, deckCount }) {
  return (
    <section className="stats-grid">
      <article>
        <h2>{activeUser?.username}</h2>
        <p>{activeUser?.email}</p>
      </article>
      <article>
        <h2>{totalOwnedCards}</h2>
        <p>Total Cards Owned</p>
      </article>
      <article>
        <h2>{wishlistCount}</h2>
        <p>Wishlist Entries</p>
      </article>
      <article>
        <h2>{deckCount}</h2>
        <p>Saved Decks</p>
      </article>
    </section>
  )
}
