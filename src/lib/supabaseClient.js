//All APIs and URLs are in the .env file for personal reference
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

//Public readiness status. NOTE: used by UI panels and data loaders.
export const supabaseConfigStatus = {
  ready: Boolean(supabaseUrl && supabaseAnonKey),
  reason:
    !supabaseUrl && !supabaseAnonKey
      ? 'missing URL and anon key'
      : !supabaseUrl
        ? 'missing URL'
        : !supabaseAnonKey
          ? 'missing anon key'
          : 'ready',
}

//Build a common header for Supabase REST API calls
function buildHeaders(extraHeaders = {}) {
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
    ...extraHeaders,
  }
}

//Converts OPTIONAL query parameterss to a URL query string
function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }
    searchParams.set(key, String(value))
  })
  return searchParams.toString()
}

//Perform 1 GET request againt a Supabase table with the optional filters
export async function supabaseSelect(table, options = {}) {
  if (!supabaseConfigStatus.ready) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }

  const queryString = buildQueryString({
    select: options.select ?? '*',
    ...options.filters,
    limit: options.limit,
    offset: options.offset,
    order: options.order,
  })
  const url = `${supabaseUrl}/rest/v1/${table}?${queryString}`
  const retryCount = options.retryCount ?? 2
  let lastError = null
  let response = null

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: buildHeaders(),
      })
      break
    } catch (error) {
      lastError = error
      if (attempt < retryCount) {
        //Retry if something gets fucked up
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
      }
    }
  }

  if (!response) {
    throw new Error(`Supabase request failed (network): ${lastError?.message ?? 'unknown error'}`)
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Supabase request failed (${response.status}): ${errorText}`)
  }

  return response.json()
}

//Iterates through table rows until a short page is found
export async function supabaseSelectAll(table, options = {}) {
  const pageSize = options.pageSize ?? 1000
  const maxPages = options.maxPages ?? 50
  const results = []

  for (let page = 0; page < maxPages; page += 1) {
    const rows = await supabaseSelect(table, {
      ...options,
      limit: pageSize,
      offset: page * pageSize,
    })
    results.push(...rows)

    if (rows.length < pageSize) {
      break
    }
  }

  return results
}

// Inserts row payload and returns created rows.
export async function supabaseInsert(table, payload) {
  if (!supabaseConfigStatus.ready) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }

  const url = `${supabaseUrl}/rest/v1/${table}`
  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Supabase insert failed with status ${response.status}`)
  }

  return response.json()
}

//Supabase info
export async function supabaseUpsert(table, payload, onConflict = '') {
  if (!supabaseConfigStatus.ready) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }

  const queryString = buildQueryString(onConflict ? { on_conflict: onConflict } : {})
  const url = `${supabaseUrl}/rest/v1/${table}${queryString ? `?${queryString}` : ''}`
  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders({
      Prefer: 'resolution=merge-duplicates,return=representation',
    }),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Supabase upsert failed (${response.status}): ${errorText}`)
  }

  return response.json()
}
