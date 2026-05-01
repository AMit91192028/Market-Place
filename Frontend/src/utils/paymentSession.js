const STORAGE_PREFIX = 'marketplace-payment:'

function getStorageKey(orderId) {
  return `${STORAGE_PREFIX}${orderId}`
}

export function savePaymentSnapshot(orderId, payment) {
  if (typeof window === 'undefined' || !orderId || !payment) {
    return
  }

  window.localStorage.setItem(getStorageKey(orderId), JSON.stringify(payment))
}

export function getPaymentSnapshot(orderId) {
  if (typeof window === 'undefined' || !orderId) {
    return null
  }

  const rawSnapshot = window.localStorage.getItem(getStorageKey(orderId))

  if (!rawSnapshot) {
    return null
  }

  try {
    return JSON.parse(rawSnapshot)
  } catch {
    return null
  }
}

export function clearPaymentSnapshot(orderId) {
  if (typeof window === 'undefined' || !orderId) {
    return
  }

  window.localStorage.removeItem(getStorageKey(orderId))
}

export async function loadRazorpayCheckoutScript() {
  if (typeof window === 'undefined') {
    return false
  }

  if (window.Razorpay) {
    return true
  }

  const existingScript = document.querySelector('script[data-razorpay-checkout="true"]')

  if (existingScript) {
    return new Promise((resolve) => {
      existingScript.addEventListener('load', () => resolve(true), { once: true })
      existingScript.addEventListener('error', () => resolve(false), { once: true })
    })
  }

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.razorpayCheckout = 'true'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function openRazorpayCheckout({ key, order, payment, user }) {
  return new Promise((resolve, reject) => {
    if (!window?.Razorpay) {
      reject(new Error('Razorpay Checkout is unavailable right now.'))
      return
    }

    const checkout = new window.Razorpay({
      key,
      amount: Number(payment?.price?.amount || 0),
      currency: payment?.price?.currency || 'INR',
      name: 'MarketPlace',
      description: `Order #${order?._id?.slice(-8) || 'checkout'}`,
      order_id: payment?.razorpayOrderId,
      prefill: {
        name:
          user?.fullName?.firstName && user?.fullName?.lastName
            ? `${user.fullName.firstName} ${user.fullName.lastName}`
            : user?.username || user?.email?.split('@')[0] || '',
        email: user?.email || '',
      },
      theme: {
        color: '#0f766e',
      },
      modal: {
        ondismiss: () => reject(new Error('Payment window closed before completion.')),
      },
      handler: (response) => resolve(response),
    })

    checkout.on('payment.failed', (response) => {
      reject(new Error(response?.error?.description || 'Payment failed. Please try again.'))
    })

    checkout.open()
  })
}
