//Debug panel to show Supabase data for debugging
export default function BackendConfigPanel({
  supabaseUrl,
  anonConfigured,
  clientReady,
  clientReason,
  catalogSource,
  syncMessage,
  tableLoadDetails,
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h3>Backend Configuration</h3>
        <p>Supabase env vars are wired, and card search now loads from your Supabase card tables.</p>
      </div>
      <code className="config-block">
        Supabase URL: {supabaseUrl ?? 'VITE_SUPABASE_URL not set'}
        <br />
        Supabase anon key: {anonConfigured ? 'configured' : 'VITE_SUPABASE_ANON_KEY not set'}
        <br />
        Client setup: {clientReady ? 'ready' : clientReason}
        <br />
        Catalog source: {catalogSource}
        <br />
        Catalog status: {syncMessage}
        <br />
        Table rows:{' '}
        {tableLoadDetails.length === 0
          ? 'not loaded'
          : tableLoadDetails
              .map((detail) =>
                detail.error
                  ? `${detail.table}=error(${detail.error.slice(0, 140)})`
                  : `${detail.table}=${detail.rows}`,
              )
              .join(', ')}
        <br />
        Owned/wishlist status: local app state (can be wired to a dedicated table next)
      </code>
    </section>
  )
}
