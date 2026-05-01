const FALLBACK_BADGE = 'Next-day deals'

export function formatCurrency(amount = 0, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)
}

export function formatDateTime(value) {
  if (!value) {
    return 'Just now'
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatStatusLabel(status = '') {
  return String(status)
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function createProductPlaceholder(label = 'Marketplace item') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="50%" stop-color="#2563eb"/>
          <stop offset="100%" stop-color="#38bdf8"/>
        </linearGradient>
      </defs>
      <rect width="800" height="800" rx="40" fill="url(#bg)"/>
      <circle cx="635" cy="150" r="92" fill="rgba(255,255,255,0.12)"/>
      <circle cx="170" cy="630" r="132" fill="rgba(255,255,255,0.08)"/>
      <text x="70" y="380" fill="#ffffff" font-size="56" font-family="Arial, sans-serif" font-weight="700">${label
        .slice(0, 22)
        .replace(/&/g, 'and')}</text>
      <text x="70" y="450" fill="rgba(255,255,255,0.72)" font-size="28" font-family="Arial, sans-serif">Trusted marketplace pick</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function getProductImage(product) {
  return (
    product?.images?.[0]?.url ||
    product?.images?.[0]?.thumbnail ||
    createProductPlaceholder(product?.title || 'Marketplace item')
  )
}

export function getProductDescription(description) {
  if (Array.isArray(description)) {
    return description.filter(Boolean).join('\n')
  }

  return description || ''
}

export function normalizeProductDescriptionInput(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean).join('\n')
  }

  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*]\s*/, '').trim())
    .filter(Boolean)
    .join('\n')
}

export function toProductDescriptionTextarea(value) {
  return getProductDescription(value)
}

export function formatProductCategory(category) {
  const value = String(category || '').trim()

  if (!value) {
    return 'Uncategorized'
  }

  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function getCategoryMonogram(category) {
  const normalized = formatProductCategory(category)

  return (
    normalized
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase() || 'MP'
  )
}

export function formatAddress(address) {
  if (!address) {
    return 'No address selected'
  }

  const zip = address.zip || address.pincode || ''

  return [address.street, `${address.city}, ${address.state} ${zip}`.trim(), address.country]
    .filter(Boolean)
    .join(', ')
}

export function getAddressSummary(address) {
  if (!address) {
    return 'Location not set'
  }

  return (
    [address.city, address.state].filter(Boolean).join(', ') ||
    address.street ||
    address.country ||
    'Saved address'
  )
}

export function toOrderAddress(address) {
  return {
    street: address?.street || '',
    city: address?.city || '',
    state: address?.state || '',
    pincode: address?.pincode || address?.zip || '',
    country: address?.country || 'India',
  }
}

export function computeCartSummary(items = []) {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.currentPrice?.amount || 0) * item.quantity
  }, 0)

  const shipping = subtotal > 1499 ? 0 : items.length > 0 ? 99 : 0
  const tax = Math.round(subtotal * 0.08)
  const total = subtotal + shipping + tax

  return {
    subtotal,
    shipping,
    tax,
    total,
  }
}

export function getWelcomeName(user) {
  if (!user) {
    return 'Guest'
  }

  if (user.fullName?.firstName) {
    return user.fullName.firstName
  }

  return user.username || user.email?.split('@')[0] || 'Shopper'
}

export function getUserDisplayName(user) {
  if (!user) {
    return 'Marketplace buyer'
  }

  if (user.fullName?.firstName || user.fullName?.lastName) {
    return [user.fullName.firstName, user.fullName.lastName].filter(Boolean).join(' ')
  }

  return user.name || user.username || user.email?.split('@')[0] || 'Marketplace buyer'
}

export function getOrderLineTotal(item) {
  return Number(item?.price?.amount) || 0
}

export function getOrderValue(order) {
  return (order?.items || []).reduce((sum, item) => sum + getOrderLineTotal(item), 0)
}

export function getBadgeText(product) {
  if (product?.stock > 20) {
    return 'Top rated'
  }

  if (product?.stock > 0) {
    return 'Selling fast'
  }

  return FALLBACK_BADGE
}

export function getProductOriginalPrice(product) {
  const currentAmount = Number(product?.price?.amount) || 0
  const hasDiscount = product?.stock > 0 && product?.stock < 25
  const discountRate = hasDiscount ? 0.12 : 0
  const originalAmount = discountRate ? Math.round(currentAmount / (1 - discountRate)) : currentAmount

  return Math.max(originalAmount, currentAmount)
}

export function getProductDiscountPercent(product) {
  const currentAmount = Number(product?.price?.amount) || 0
  const originalAmount = getProductOriginalPrice(product)

  if (!currentAmount || originalAmount <= currentAmount) {
    return 0
  }

  return Math.round(((originalAmount - currentAmount) / originalAmount) * 100)
}

export function getProductRating(product) {
  const stock = Number(product?.stock) || 0
  const seededValue = Math.min(45, stock + 28)

  return Number((3.5 + seededValue / 100).toFixed(1))
}

export function getDeliveryLabel(product) {
  const stock = Number(product?.stock) || 0

  if (stock <= 0) {
    return 'Currently unavailable'
  }

  if (stock < 5) {
    return 'Delivery in 2-4 days'
  }

  return 'Free delivery by tomorrow'
}
