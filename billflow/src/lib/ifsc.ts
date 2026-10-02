import { useEffect, useState } from 'react'
import { isValidIfsc } from './invoice'

// Razorpay's free public IFSC directory (RBI data). No key needed and it
// allows browser calls (Access-Control-Allow-Origin: *). Only the IFSC code
// is sent. If it's unreachable, bank name and branch simply stay manual.
const IFSC_API = 'https://ifsc.razorpay.com/'

export interface IfscInfo {
  bank: string
  branch: string // "Park Street, Jaipur"
}

export type IfscLookup =
  | { status: 'idle' | 'loading' | 'not_found' | 'error' }
  | { status: 'found'; info: IfscInfo }

function titleCase(value: string): string {
  return value.toLowerCase().replace(/\b[a-z]/g, (letter) => letter.toUpperCase()).trim()
}

const cache = new Map<string, IfscInfo | null>()

async function fetchIfsc(code: string, signal: AbortSignal): Promise<IfscInfo | null> {
  if (cache.has(code)) return cache.get(code)!
  const response = await fetch(`${IFSC_API}${code}`, { signal })
  if (response.status === 404) {
    cache.set(code, null)
    return null
  }
  if (!response.ok) throw new Error(`IFSC lookup failed (${response.status})`)
  const data = (await response.json()) as { BANK?: string; BRANCH?: string; CITY?: string }
  const branch = titleCase(data.BRANCH ?? '')
  const city = titleCase(data.CITY ?? '')
  const info: IfscInfo = {
    bank: (data.BANK ?? '').trim(),
    branch: city && !branch.toLowerCase().includes(city.toLowerCase()) ? `${branch}, ${city}` : branch,
  }
  cache.set(code, info)
  return info
}

export function useIfscLookup(ifsc: string): IfscLookup {
  const code = ifsc.trim().toUpperCase()
  const valid = isValidIfsc(code)
  const [result, setResult] = useState<{ code: string; lookup: IfscLookup }>({ code: '', lookup: { status: 'idle' } })

  useEffect(() => {
    if (!valid) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setResult({ code, lookup: { status: 'loading' } })
      fetchIfsc(code, controller.signal)
        .then((info) =>
          setResult({ code, lookup: info ? { status: 'found', info } : { status: 'not_found' } }),
        )
        .catch((error: unknown) => {
          if ((error as Error).name !== 'AbortError') setResult({ code, lookup: { status: 'error' } })
        })
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [code, valid])

  return valid && result.code === code ? result.lookup : { status: 'idle' }
}
