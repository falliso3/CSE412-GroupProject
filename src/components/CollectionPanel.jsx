import { cardImageOrPlaceholder } from '../utils/catalogUtils'

//Collection list with filters and editable owned and wishlist fields.
export default function CollectionPanel({
  search,
  onSearchChange,
  setFilter,
  onSetFilterChange,
  seriesFilter,
  onSeriesFilterChange,
  sortBy,
  onSortByChange,
  setOptions,
  seriesOptions,
  visibleCards,
  activeUserOwned,
  onUpdateOwnedCard,
  onToggleWishlist,
}) {
  //Should be pretty self explanatory: Just has all of the filters and stuff
  return (
    <section className="panel">
      <div className="panel-head">
        <h3>Collection Management</h3>
        <p>Filter by set/series and track card ownership + wishlist state.</p>
      </div>
      <div className="filter-grid">
        <label className="inline-control" htmlFor="search">
          Search
          <input
            id="search"
            value={search}
            placeholder="Card name or ID"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
        <label className="inline-control" htmlFor="set-filter">
          Set
          <select id="set-filter" value={setFilter} onChange={(event) => onSetFilterChange(event.target.value)}>
            <option value="all">All sets</option>
            {setOptions.map((setName) => (
              <option key={setName} value={setName}>
                {setName}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-control" htmlFor="series-filter">
          Series
          <select
            id="series-filter"
            value={seriesFilter}
            onChange={(event) => onSeriesFilterChange(event.target.value)}
          >
            <option value="all">All series</option>
            {seriesOptions.map((seriesName) => (
              <option key={seriesName} value={seriesName}>
                {seriesName}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-control" htmlFor="sort-by">
          Sort By
          <select id="sort-by" value={sortBy} onChange={(event) => onSortByChange(event.target.value)}>
            <option value="release-desc">Release Date (Newest)</option>
            <option value="release-asc">Release Date (Oldest)</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>
        </label>
      </div>

      <div className="table-wrap">
        <p className="card-sub">Showing {visibleCards.length} cards</p>
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Card</th>
              <th>Set / Series</th>
              <th>Release</th>
              <th>Type</th>
              <th>Owned</th>
              <th>Wishlist</th>
            </tr>
          </thead>
          <tbody>
            {visibleCards.map((card) => {
              const entry = activeUserOwned[card.cardId] ?? { amtOwned: 0, isWished: false }
              return (
                <tr key={card.cardId}>
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
                  <td>
                    <p className="card-title">{card.set}</p>
                    <p className="card-sub">{card.series}</p>
                  </td>
                  <td>{card.releaseDate}</td>
                  <td>{card.supertype}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={entry.amtOwned}
                      onChange={(event) => onUpdateOwnedCard(card.cardId, Number(event.target.value))}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={Boolean(entry.isWished)}
                      onChange={(event) => onToggleWishlist(card.cardId, event.target.checked)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
