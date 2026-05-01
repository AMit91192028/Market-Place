import { useEffect, useRef, useState } from 'react'

const listeners = new Set()
let toastIdCounter = 0

function publishToast(type, message, options = {}) {
  toastIdCounter += 1

  const payload = {
    id: options.toastId ?? `toast-${Date.now()}-${toastIdCounter}`,
    type,
    message: String(message || ''),
    autoClose: options.autoClose,
  }

  listeners.forEach((listener) => listener(payload))
  return payload.id
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function normalizePosition(position) {
  return String(position || 'top-right').replace(/[^a-z-]/gi, '')
}

export const toast = {
  success(message, options) {
    return publishToast('success', message, options)
  },
  error(message, options) {
    return publishToast('error', message, options)
  },
  info(message, options) {
    return publishToast('info', message, options)
  },
  warning(message, options) {
    return publishToast('warning', message, options)
  },
  dismiss(toastId) {
    listeners.forEach((listener) => listener({ dismiss: true, id: toastId }))
  },
}

export function ToastContainer({
  position = 'top-right',
  autoClose = 2500,
  newestOnTop = false,
}) {
  const [items, setItems] = useState([])
  const timersRef = useRef(new Map())

  useEffect(() => {
    function removeToast(id) {
      const timerId = timersRef.current.get(id)
      if (timerId) {
        window.clearTimeout(timerId)
        timersRef.current.delete(id)
      }

      setItems((current) => current.filter((item) => item.id !== id))
    }

    const unsubscribe = subscribe((payload) => {
      if (payload.dismiss) {
        if (payload.id) {
          removeToast(payload.id)
        } else {
          Array.from(timersRef.current.keys()).forEach(removeToast)
        }
        return
      }

      setItems((current) => {
        const nextItems = newestOnTop ? [payload, ...current] : [...current, payload]
        return nextItems.filter((item, index, array) => {
          return array.findIndex((candidate) => candidate.id === item.id) === index
        })
      })

      const closeAfter = Number(payload.autoClose ?? autoClose)

      if (closeAfter > 0) {
        const timerId = window.setTimeout(() => {
          removeToast(payload.id)
        }, closeAfter)

        timersRef.current.set(payload.id, timerId)
      }
    })

    return () => {
      unsubscribe()
      timersRef.current.forEach((timerId) => window.clearTimeout(timerId))
      timersRef.current.clear()
    }
  }, [autoClose, newestOnTop])

  if (!items.length) {
    return null
  }

  return (
    <div className={`toastify-container toastify-${normalizePosition(position)}`} aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={`toastify-toast toastify-${item.type}`} role="status">
          <span>{item.message}</span>
          <button type="button" className="toastify-close" onClick={() => toast.dismiss(item.id)}>
            x
          </button>
        </div>
      ))}
    </div>
  )
}
