import axios from 'axios'

const AUTH_TOKEN_STORAGE_KEY = 'marketplace.authToken'
const DEFAULT_API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000)

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

export function getStoredAuthToken() {
  if (typeof window === 'undefined') {
    return ''
  }

  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function setStoredAuthToken(token) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (token) {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
      return
    }

    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  } catch {
    // Ignore storage failures and continue with cookie auth where possible.
  }
}

export function clearStoredAuthToken() {
  setStoredAuthToken('')
}

function getHeaderValue(headers, name) {
  if (!headers) {
    return ''
  }

  if (typeof headers.get === 'function') {
    return headers.get(name) || ''
  }

  return headers[name] || headers[name.toLowerCase()] || ''
}

function setHeaderValue(headers, name, value) {
  if (!headers) {
    return { [name]: value }
  }

  if (typeof headers.set === 'function') {
    headers.set(name, value)
    return headers
  }

  return {
    ...headers,
    [name]: value,
  }
}

export function createServiceClient(baseURL, fallbackPath) {
  const client = axios.create({
    baseURL: resolveServiceBaseUrl(baseURL, fallbackPath),
    timeout: DEFAULT_API_TIMEOUT_MS,
    withCredentials: true,
    headers: {
      Accept: 'application/json',
    },
  })

  client.interceptors.request.use((config) => {
    const token = getStoredAuthToken()

    if (token && !getHeaderValue(config.headers, 'Authorization')) {
      config.headers = setHeaderValue(config.headers, 'Authorization', `Bearer ${token}`)
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
