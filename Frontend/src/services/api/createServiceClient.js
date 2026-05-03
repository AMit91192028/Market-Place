import axios from 'axios'

const AUTH_TOKEN_STORAGE_KEY = 'marketplace.authToken'
const DEFAULT_API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000)
const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function trimTrailingSlash(value = '') {
  return String(value).replace(/\/+$/, '')
}

export function resolveServiceBaseUrl(baseURL, fallbackPath = '') {
  const normalizedFallbackPath = trimTrailingSlash(fallbackPath)
  const rawBaseUrl = String(baseURL || '').trim()

  if (!rawBaseUrl) {
    return normalizedFallbackPath || undefined
  }

  if (rawBaseUrl.startsWith('/')) {
    return trimTrailingSlash(rawBaseUrl) || normalizedFallbackPath || undefined
  }

  try {
    const url = new URL(rawBaseUrl)
    const normalizedPathname = trimTrailingSlash(url.pathname)

    if (!normalizedPathname && normalizedFallbackPath) {
      url.pathname = normalizedFallbackPath
    }

    return trimTrailingSlash(url.toString())
  } catch {
    return trimTrailingSlash(rawBaseUrl) || normalizedFallbackPath || undefined
  }
}

function shouldUseTokenFallback() {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const candidateUrls = [
      resolveServiceBaseUrl(import.meta.env.VITE_AUTH_API_BASE || DEFAULT_API_BASE_URL, '/api/auth'),
      resolveServiceBaseUrl(import.meta.env.VITE_AI_BUDDY_URL || '', '/api/socket'),
    ].filter(Boolean)

    return candidateUrls.some((candidateUrl) => {
      const resolvedUrl = new URL(candidateUrl, window.location.origin)
      return resolvedUrl.protocol === 'http:' && resolvedUrl.origin !== window.location.origin
    })
  } catch {
    return false
  }
}

export function getStoredAuthToken() {
  if (typeof window === 'undefined') {
    return ''
  }

  try {
    const shouldUseFallback = shouldUseTokenFallback()
    const sessionToken = window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || ''
    const legacyLocalToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || ''

    if (shouldUseFallback && sessionToken) {
      return sessionToken
    }

    if (sessionToken) {
      window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    }

    if (shouldUseFallback && legacyLocalToken) {
      window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, legacyLocalToken)
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
      return legacyLocalToken
    }

    if (legacyLocalToken) {
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    }

    return ''
  } catch {
    return ''
  }
}

export function setStoredAuthToken(token) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (shouldUseTokenFallback() && token) {
      window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
    } else {
      window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    }

    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  } catch {
    // Ignore client-side cleanup failures.
  }
}

export function clearStoredAuthToken() {
  setStoredAuthToken('')
}

export function createServiceClient(baseURL, fallbackPath) {
  const client = axios.create({
    baseURL: resolveServiceBaseUrl(baseURL || DEFAULT_API_BASE_URL, fallbackPath),
    timeout: DEFAULT_API_TIMEOUT_MS,
    withCredentials: true,
    headers: {
      Accept: 'application/json',
    },
  })

  client.interceptors.request.use((config) => {
    const token = getStoredAuthToken()

    if (token) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: config.headers?.Authorization || `Bearer ${token}`,
      }
    }

    return config
  })

  return client
}

export function getApiErrorMessage(error, fallbackMessage) {
  if (error?.code === 'ECONNABORTED') {
    return 'The service took too long to respond. Please try again in a moment.'
  }

  if (!error?.response && error?.message) {
    return error.message
  }

  const data = error?.response?.data

  if (data?.message) {
    return data.message
  }

  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors[0]?.msg || fallbackMessage
  }

  if (data?.error) {
    return data.error
  }

  return fallbackMessage
}
