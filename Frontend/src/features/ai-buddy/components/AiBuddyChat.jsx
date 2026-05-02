import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { getCart } from '../../../services/api/cartApi'
import styles from '../styles/AiBuddyChat.module.css'

const DEFAULT_SOCKET_SERVER_URL = 'http://localhost:3005'
const DEFAULT_SOCKET_PATH = '/api/socket/socket.io'

function trimTrailingSlash(value = '') {
  return String(value).replace(/\/+$/, '')
}

function resolveSocketConfig(rawUrl) {
  const configuredUrl = String(rawUrl || '').trim()

  if (!configuredUrl) {
    return {
      serverUrl: DEFAULT_SOCKET_SERVER_URL,
      path: DEFAULT_SOCKET_PATH,
    }
  }

  if (configuredUrl.startsWith('/')) {
    return {
      serverUrl: window.location.origin,
      path: `${trimTrailingSlash(configuredUrl)}/socket.io`,
    }
  }

  try {
    const url = new URL(configuredUrl)
    const basePath = trimTrailingSlash(url.pathname)

    return {
      serverUrl: `${url.protocol}//${url.host}`,
      path: `${basePath || '/socket.io'}/socket.io`.replace(/\/socket\.io\/socket\.io$/, '/socket.io'),
    }
  } catch {
    return {
      serverUrl: configuredUrl,
      path: DEFAULT_SOCKET_PATH,
    }
  }
}

const { serverUrl: SOCKET_SERVER_URL, path: SOCKET_PATH } = resolveSocketConfig(
  import.meta.env.VITE_AI_BUDDY_URL
)

const SUGGESTIONS = [
  'Find wireless headphones under 2000',
  'Add a phone case to my cart',
  'Show me budget home products',
]

function createAssistantMessage(content) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role: 'assistant',
    content,
  }
}

function createUserMessage(content) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role: 'user',
    content,
  }
}

export default function AiBuddyChat() {
  const dispatch = useDispatch()
  const { authChecked, isAuthenticated, role } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([
    createAssistantMessage(
      'Hi, I am AI Buddy. Ask me to find products or add available items to your cart for you.'
    ),
  ])
  const [status, setStatus] = useState('idle')
  const [isWaitingForReply, setIsWaitingForReply] = useState(false)
  const socketRef = useRef(null)
  const bodyRef = useRef(null)

  const canUseAssistant = authChecked && isAuthenticated && role === 'user'
  const needsSignIn = authChecked && !isAuthenticated
  const isUnsupportedRole = authChecked && isAuthenticated && role !== 'user'

  useEffect(() => {
    if (!isOpen || !canUseAssistant) {
      setStatus(canUseAssistant ? 'idle' : 'offline')
      return undefined
    }

    setStatus('connecting')

    const socket = io(SOCKET_SERVER_URL, {
      path: SOCKET_PATH,
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setStatus('connected')
    })

    socket.on('connect_error', (error) => {
      setStatus('error')
      setIsWaitingForReply(false)
      setMessages((current) => [
        ...current,
        createAssistantMessage(error.message || 'Unable to connect to AI Buddy right now.'),
      ])
    })

    socket.on('message', async (message) => {
      setMessages((current) => [...current, createAssistantMessage(message)])
      setIsWaitingForReply(false)

      // Refresh cart after the assistant responds so AI-driven add-to-cart actions appear immediately.
      await dispatch(getCart())
    })

    socket.on('disconnect', () => {
      setStatus('offline')
      setIsWaitingForReply(false)
    })

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
    }
  }, [canUseAssistant, dispatch, isOpen])

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [messages, isWaitingForReply])

  useEffect(() => {
    if (!isAuthenticated) {
      setIsWaitingForReply(false)
    }
  }, [isAuthenticated])

  function sendMessage(content) {
    const trimmed = content.trim()

    if (!trimmed || !socketRef.current || status !== 'connected') {
      return
    }

    setMessages((current) => [...current, createUserMessage(trimmed)])
    setDraft('')
    setIsWaitingForReply(true)
    socketRef.current.emit('message', trimmed)
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendMessage(draft)
  }

  return (
    <div className={styles.root}>
      {isOpen ? (
        <section id="ai-buddy-panel" className={styles.panel} aria-label="AI Buddy chat">
          <header className={styles.header}>
            <div>
              <span className={styles.eyebrow}>AI shopping assistant</span>
              <h2>AI Buddy</h2>
            </div>

            <div className={styles.headerActions}>
              <span
                className={`${styles.statusPill} ${
                  status === 'connected'
                    ? styles.connected
                    : status === 'connecting'
                      ? styles.connecting
                      : styles.offline
                }`}
              >
                {status === 'connected'
                  ? 'Live'
                  : status === 'connecting'
                    ? 'Connecting'
                    : status === 'error'
                      ? 'Retry needed'
                      : 'Offline'}
              </span>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                aria-label="Close AI Buddy"
              >
                x
              </button>
            </div>
          </header>

          <div className={styles.body} ref={bodyRef}>
            {!authChecked ? (
              <div className={styles.stateCard}>
                <h3>Checking your session</h3>
                <p>AI Buddy is preparing your secure shopping connection.</p>
              </div>
            ) : null}

            {needsSignIn ? (
              <div className={styles.stateCard}>
                <h3>Sign in to start chatting</h3>
                <p>AI Buddy uses your current session to search products and add available items into your cart.</p>
                <Link to="/auth/login" className={styles.primaryAction}>
                  Go to sign in
                </Link>
              </div>
            ) : null}

            {isUnsupportedRole ? (
              <div className={styles.stateCard}>
                <h3>Customer access only</h3>
                <p>AI Buddy is currently set up for shopper accounts because it can add products directly into cart.</p>
              </div>
            ) : null}

            {authChecked && !needsSignIn && !isUnsupportedRole ? (
              <>
                <div className={styles.suggestionRow}>
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className={styles.suggestionChip}
                      onClick={() => sendMessage(suggestion)}
                      disabled={status !== 'connected' || isWaitingForReply}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                <div className={styles.messageList}>
                  {messages.map((message) => (
                    <article
                      key={message.id}
                      className={`${styles.messageBubble} ${
                        message.role === 'user' ? styles.userBubble : styles.assistantBubble
                      }`}
                    >
                      <span className={styles.messageLabel}>
                        {message.role === 'user' ? 'You' : 'AI Buddy'}
                      </span>
                      <p>{message.content}</p>
                    </article>
                  ))}

                  {isWaitingForReply ? (
                    <article className={`${styles.messageBubble} ${styles.assistantBubble}`}>
                      <span className={styles.messageLabel}>AI Buddy</span>
                      <div className={styles.typingDots} aria-label="AI Buddy is typing">
                        <span />
                        <span />
                        <span />
                      </div>
                    </article>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>

          <form className={styles.composer} onSubmit={handleSubmit}>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask AI Buddy to find a product or add one to your cart"
              disabled={!canUseAssistant || isWaitingForReply}
              rows={2}
            />
            <button type="submit" className={styles.sendButton} disabled={!draft.trim() || !canUseAssistant || isWaitingForReply}>
              Send
            </button>
          </form>
        </section>
      ) : (
        <button
          type="button"
          className={styles.launcher}
          onClick={() => setIsOpen(true)}
          aria-expanded={false}
          aria-controls="ai-buddy-panel"
        >
          <span className={styles.launcherLabel}>AI</span>
        </button>
      )}
    </div>
  )
}
