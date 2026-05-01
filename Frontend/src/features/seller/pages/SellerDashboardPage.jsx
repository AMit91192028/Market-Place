import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  deleteProduct,
  getSellerProducts,
  updateProduct,
} from '../../../services/api/productApi'
import {
  createSellerDashboardProduct,
  getSellerDashboardProducts,
  getSellerMetrics,
  getSellerOrders,
} from '../../../services/api/sellerDashboardApi'
import {
  formatCurrency,
  formatDateTime,
  formatProductCategory,
  formatStatusLabel,
  getOrderValue,
  getProductImage,
  getUserDisplayName,
} from '../../../utils/marketplace'
import styles from '../styles/SellerDashboard.module.css'

const LIVE_REFRESH_MS = 30000
const SELLER_ORDER_FLOW = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
const EMPTY_CREATE_DRAFT = {
  title: '',
  category: '',
  description: '',
  priceAmount: 999,
  priceCurrency: 'INR',
  stock: 10,
  images: [],
}

function getPaymentBadgeClass(status, cssModule) {
  switch (status) {
    case 'COMPLETED':
      return cssModule.statusSuccess
    case 'PENDING':
      return cssModule.statusPending
    case 'FAILED':
      return cssModule.statusFailed
    default:
      return cssModule.statusMuted
  }
}

function isRevenueReadyOrder(order) {
  return order?.paymentStatus === 'COMPLETED' || ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order?.status)
}

function getChartPoints(values = []) {
  if (!values.length) {
    return []
  }

  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1

  return values.map((value, index) => {
    const x = values.length === 1 ? 50 : 8 + (index * 84) / (values.length - 1)
    const y = 88 - ((value - min) / range) * 64

    return {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
    }
  })
}

function getAreaPath(points = []) {
  if (!points.length) {
    return ''
  }

  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]
  const linePath = points.map((point) => `${point.x},${point.y}`).join(' ')

  return `M ${firstPoint.x} 92 L ${linePath} L ${lastPoint.x} 92 Z`
}

function clampLabel(value = '', maxLength = 16) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, Math.max(maxLength - 3, 1))}...`
}

function getProductDescriptionText(description) {
  if (Array.isArray(description)) {
    return description.join('\n')
  }

  return description || ''
}

function buildDailyPerformance(orders = []) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))

    return {
      key: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(date),
      revenue: 0,
      orders: 0,
      units: 0,
    }
  })

  const dayIndex = days.reduce((result, day, index) => {
    result[day.key] = index
    return result
  }, {})

  orders.forEach((order) => {
    const createdAt = new Date(order.createdAt)

    if (Number.isNaN(createdAt.getTime())) {
      return
    }

    createdAt.setHours(0, 0, 0, 0)
    const key = createdAt.toISOString().slice(0, 10)
    const targetIndex = dayIndex[key]

    if (targetIndex === undefined) {
      return
    }

    const units = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)

    days[targetIndex].orders += 1
    days[targetIndex].units += units

    if (isRevenueReadyOrder(order)) {
      days[targetIndex].revenue += getOrderValue(order)
    }
  })

  return days
}

function TrendChart({ values, stroke, fill, startLabel, endLabel }) {
  const points = getChartPoints(values)
  const areaPath = getAreaPath(points)

  if (!points.length) {
    return null
  }

  return (
    <div className={styles.chartFrame}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.chartSvg} aria-hidden="true">
        <line x1="8" y1="24" x2="92" y2="24" className={styles.chartGridLine} />
        <line x1="8" y1="56" x2="92" y2="56" className={styles.chartGridLine} />
        <line x1="8" y1="88" x2="92" y2="88" className={styles.chartGridLine} />
        <path d={areaPath} fill={fill} />
        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.map((point) => `${point.x},${point.y}`).join(' ')}
        />
        {points.map((point) => (
          <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="2.5" fill={stroke} />
        ))}
      </svg>

      <div className={styles.chartLabels}>
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  )
}

function StockBarsChart({ items }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className={styles.stockBars}>
      {items.map((item) => (
        <div key={item.label} className={styles.stockBarItem}>
          <div className={styles.stockBarTrack}>
            <div
              className={styles.stockBarFill}
              style={{ height: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 18 : 0)}%` }}
            />
          </div>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function SellerDashboardPage() {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { sellerProducts, isLoading: productLoading, error: productError } = useSelector((state) => state.product)
  const {
    metrics,
    orders,
    products: dashboardProducts,
    isLoadingMetrics,
    isLoadingOrders,
    isLoadingProducts,
    error,
  } = useSelector((state) => state.sellerDashboard)
  const [searchParams, setSearchParams] = useSearchParams()
  const [drafts, setDrafts] = useState({})
  const [createDraft, setCreateDraft] = useState(EMPTY_CREATE_DRAFT)
  const [message, setMessage] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [savingProductId, setSavingProductId] = useState('')
  const [deletingProductId, setDeletingProductId] = useState('')

  const isComposerOpen = searchParams.get('composer') === '1'
  const refreshDashboard = useEffectEvent(async () => {
    await Promise.all([
      dispatch(getSellerMetrics()),
      dispatch(getSellerOrders()),
      dispatch(getSellerDashboardProducts()),
      dispatch(getSellerProducts()),
    ])

    setLastUpdatedAt(new Date().toISOString())
  })

  useEffect(() => {
    refreshDashboard()

    const intervalId = window.setInterval(() => {
      refreshDashboard()
    }, LIVE_REFRESH_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [refreshDashboard])

  const productNameById = useMemo(() => {
    return [...dashboardProducts, ...sellerProducts].reduce((result, product) => {
      result[String(product._id)] = product.title
      return result
    }, {})
  }, [dashboardProducts, sellerProducts])

  const inventoryMetrics = useMemo(() => {
    return {
      listings: sellerProducts.length,
      stock: sellerProducts.reduce((sum, product) => sum + Number(product.stock || 0), 0),
      stockValue: sellerProducts.reduce(
        (sum, product) => sum + Number(product.stock || 0) * Number(product.price?.amount || 0),
        0
      ),
      lowStock: sellerProducts.filter((product) => Number(product.stock || 0) > 0 && Number(product.stock || 0) <= 5)
        .length,
      outOfStock: sellerProducts.filter((product) => Number(product.stock || 0) <= 0).length,
    }
  }, [sellerProducts])

  const performanceSeries = useMemo(() => buildDailyPerformance(orders), [orders])

  const statusSummary = useMemo(() => {
    return SELLER_ORDER_FLOW.map((status) => ({
      status,
      count: orders.filter((order) => order.status === status).length,
    })).filter((item) => item.count > 0)
  }, [orders])

  const inventorySeries = useMemo(() => {
    return [...sellerProducts]
      .sort((left, right) => Number(right.stock || 0) - Number(left.stock || 0))
      .slice(0, 5)
      .map((product) => ({
        label: clampLabel(product.title, 14),
        value: Number(product.stock || 0),
      }))
  }, [sellerProducts])

  const recentCatalog = useMemo(() => {
    return (dashboardProducts.length ? dashboardProducts : sellerProducts).slice(0, 4)
  }, [dashboardProducts, sellerProducts])

  const revenueTrend = performanceSeries.map((day) => day.revenue)
  const orderTrend = performanceSeries.map((day) => day.orders)
  const unitTrend = performanceSeries.map((day) => day.units)
  const trendStart = performanceSeries[0]?.label || 'Start'
  const trendEnd = performanceSeries[performanceSeries.length - 1]?.label || 'Today'
  const isRefreshing = isLoadingMetrics || isLoadingOrders || isLoadingProducts || productLoading
  const dashboardError = error || productError

  function setComposerOpen(open) {
    const nextParams = new URLSearchParams(searchParams)

    if (open) {
      nextParams.set('composer', '1')
    } else {
      nextParams.delete('composer')
    }

    setSearchParams(nextParams)
  }

  function updateDraft(productId, field, value) {
    setDrafts((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        [field]: value,
      },
    }))
  }

  function updateCreateDraft(field, value) {
    setCreateDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleCreateSubmit(event) {
    event.preventDefault()
    setIsPublishing(true)

    const formData = new FormData()
    formData.append('title', createDraft.title.trim())
    formData.append('category', createDraft.category.trim())
    formData.append('priceAmount', createDraft.priceAmount)
    formData.append('priceCurrency', createDraft.priceCurrency)
    formData.append('stock', createDraft.stock)
    formData.append('description', createDraft.description.trim())

    Array.from(createDraft.images || []).forEach((file) => {
      formData.append('images', file)
    })

    try {
      await dispatch(createSellerDashboardProduct(formData)).unwrap()
      setMessage('Product created and seller dashboard refreshed.')
      setCreateDraft(EMPTY_CREATE_DRAFT)
      setComposerOpen(false)
      await refreshDashboard()
    } catch (createError) {
      setMessage(createError || 'Unable to create this product.')
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleSave(productId) {
    const sourceProduct = sellerProducts.find((product) => product._id === productId)
    const draft = drafts[productId] || {
      title: sourceProduct?.title || '',
      category: sourceProduct?.category || '',
      description: getProductDescriptionText(sourceProduct?.description),
      priceAmount: sourceProduct?.price?.amount || 0,
      stock: sourceProduct?.stock || 0,
    }

    setSavingProductId(productId)

    try {
      await dispatch(
        updateProduct({
          productId,
          data: {
            title: draft.title,
            category: draft.category,
            description: draft.description.trim(),
            stock: Number(draft.stock),
            price: {
              amount: Number(draft.priceAmount),
              currency: 'INR',
            },
          },
        })
      ).unwrap()

      setMessage('Inventory updated and seller dashboard refreshed.')
      await refreshDashboard()
    } catch (updateError) {
      setMessage(updateError || 'Unable to update this product.')
    } finally {
      setSavingProductId('')
    }
  }

  async function handleDelete(productId) {
    setDeletingProductId(productId)

    try {
      await dispatch(deleteProduct(productId)).unwrap()
      setMessage('Product deleted and seller dashboard refreshed.')
      await refreshDashboard()
    } catch (deleteError) {
      setMessage(deleteError || 'Unable to delete this product.')
    } finally {
      setDeletingProductId('')
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Seller operations</span>
          <h1>Track your storefront, live orders, and inventory from one seller-first workspace.</h1>
          <p>
            This view pulls seller-scoped metrics, seller orders, and your mirrored catalog so the
            workspace stays focused on the business you own.
          </p>

          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setComposerOpen(!isComposerOpen)}
            >
              {isComposerOpen ? 'Close product form' : 'Launch new listing'}
            </button>
            <a href="#inventory-editor" className={styles.secondaryButton}>
              Jump to inventory
            </a>
          </div>

          <div className={styles.metricStrip}>
            <div className={styles.metricPill}>
              <strong>{inventoryMetrics.listings}</strong>
              <span>Active seller listings</span>
            </div>
            <div className={styles.metricPill}>
              <strong>{inventoryMetrics.lowStock}</strong>
              <span>Low-stock alerts</span>
            </div>
            <div className={styles.metricPill}>
              <strong>{user?.email || 'seller@marketplace'}</strong>
              <span>Logged-in seller account</span>
            </div>
          </div>
        </div>

        <div className={styles.heroPanel}>
          <div className={styles.panelHeaderCompact}>
            <span className={styles.panelLabel}>Live snapshot</span>
            <span className={styles.liveChip}>{isRefreshing ? 'Refreshing...' : 'Auto-refresh 30s'}</span>
          </div>

          <div className={styles.heroHighlight}>
            <strong>{formatCurrency(metrics.revenue)}</strong>
            <span>Revenue ready from paid or fulfilled seller orders</span>
          </div>

          <div className={styles.heroGrid}>
            <div className={styles.heroTile}>
              <strong>{metrics.sales}</strong>
              <span>Units sold</span>
            </div>
            <div className={styles.heroTile}>
              <strong>{metrics.totalOrders}</strong>
              <span>Orders received</span>
            </div>
            <div className={styles.heroTile}>
              <strong>{metrics.pendingOrders}</strong>
              <span>Orders awaiting action</span>
            </div>
            <div className={styles.heroTile}>
              <strong>{inventoryMetrics.stock}</strong>
              <span>Units in stock</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.liveBar}>
        <div className={styles.liveIndicator}>
          <span className={styles.liveDot} />
          <strong>Seller feed is live</strong>
        </div>
        <span>
          {lastUpdatedAt ? `Last synced ${formatDateTime(lastUpdatedAt)}` : 'Preparing seller snapshot...'}
        </span>
      </div>

      {message ? <div className={styles.successBanner}>{message}</div> : null}
      {dashboardError ? <div className={styles.errorBanner}>{dashboardError}</div> : null}

      {isComposerOpen ? (
        <article className={`${styles.panel} ${styles.createComposer}`} id="seller-create-form">
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelLabel}>Add product</span>
              <h2>Create a new seller listing</h2>
            </div>
            <span className={styles.panelMeta}>Description is sent as plain text.</span>
          </div>

          <form className={styles.createForm} onSubmit={handleCreateSubmit}>
            <label className={styles.fieldBlock}>
              <span>Product title</span>
              <input
                type="text"
                value={createDraft.title}
                onChange={(event) => updateCreateDraft('title', event.target.value)}
                required
              />
            </label>

            <label className={styles.fieldBlock}>
              <span>Category</span>
              <input
                type="text"
                placeholder="Ex: electronics, fashion, home"
                value={createDraft.category}
                onChange={(event) => updateCreateDraft('category', event.target.value)}
                required
              />
            </label>

            <label className={styles.fieldBlock}>
              <span>Description</span>
              <textarea
                placeholder="Write a short product description"
                value={createDraft.description}
                onChange={(event) => updateCreateDraft('description', event.target.value)}
              />
            </label>

            <div className={styles.inlineFields}>
              <label className={styles.fieldBlock}>
                <span>Price amount</span>
                <input
                  type="number"
                  min="1"
                  value={createDraft.priceAmount}
                  onChange={(event) => updateCreateDraft('priceAmount', event.target.value)}
                  required
                />
              </label>

              <label className={styles.fieldBlock}>
                <span>Currency</span>
                <select
                  value={createDraft.priceCurrency}
                  onChange={(event) => updateCreateDraft('priceCurrency', event.target.value)}
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
              </label>

              <label className={styles.fieldBlock}>
                <span>Stock</span>
                <input
                  type="number"
                  min="0"
                  value={createDraft.stock}
                  onChange={(event) => updateCreateDraft('stock', event.target.value)}
                  required
                />
              </label>
            </div>

            <label className={styles.fieldBlock}>
              <span>Images</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => updateCreateDraft('images', Array.from(event.target.files || []))}
              />
            </label>

            <div className={styles.cardActions}>
              <button type="submit" className={styles.primaryButton} disabled={isPublishing}>
                {isPublishing ? 'Publishing...' : 'Publish product'}
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => setComposerOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </article>
      ) : null}

      <div className={styles.overviewGrid}>
        <article className={styles.overviewCard}>
          <span>Revenue</span>
          <strong>{isLoadingMetrics ? 'Refreshing...' : formatCurrency(metrics.revenue)}</strong>
          <p>Recognized from seller orders that are paid or already moving through fulfillment.</p>
        </article>
        <article className={styles.overviewCard}>
          <span>Units sold</span>
          <strong>{isLoadingMetrics ? 'Refreshing...' : metrics.sales}</strong>
          <p>Tracked only from order items that belong to your storefront.</p>
        </article>
        <article className={styles.overviewCard}>
          <span>Inventory value</span>
          <strong>{formatCurrency(inventoryMetrics.stockValue)}</strong>
          <p>Current value of the stock you still have available to sell.</p>
        </article>
        <article className={styles.overviewCard}>
          <span>Stock alerts</span>
          <strong>
            {inventoryMetrics.lowStock} low / {inventoryMetrics.outOfStock} out
          </strong>
          <p>Use the live editor below to restock, reprice, or retire listings quickly.</p>
        </article>
      </div>

      <article className={`${styles.panel} ${styles.analyticsPanel}`}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelLabel}>Live analytics</span>
            <h2>Real-time seller performance</h2>
          </div>
          <span className={styles.panelMeta}>Last 7 days, auto-updating every 30 seconds</span>
        </div>

        <div className={styles.chartGrid}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeading}>
              <span>Revenue trend</span>
              <strong>{formatCurrency(metrics.revenue)}</strong>
            </div>
            <TrendChart
              values={revenueTrend}
              stroke="#2563eb"
              fill="rgba(37, 99, 235, 0.16)"
              startLabel={trendStart}
              endLabel={trendEnd}
            />
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeading}>
              <span>Order flow</span>
              <strong>{metrics.totalOrders}</strong>
            </div>
            <TrendChart
              values={orderTrend}
              stroke="#0f766e"
              fill="rgba(14, 165, 164, 0.14)"
              startLabel={trendStart}
              endLabel={trendEnd}
            />
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeading}>
              <span>Units sold trend</span>
              <strong>{metrics.sales}</strong>
            </div>
            <TrendChart
              values={unitTrend}
              stroke="#7c3aed"
              fill="rgba(124, 58, 237, 0.14)"
              startLabel={trendStart}
              endLabel={trendEnd}
            />
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeading}>
              <span>Top stock positions</span>
              <strong>{inventoryMetrics.stock}</strong>
            </div>
            {inventorySeries.length ? (
              <StockBarsChart items={inventorySeries} />
            ) : (
              <div className={styles.chartEmpty}>Add products to unlock live stock comparison.</div>
            )}
          </div>
        </div>
      </article>

      <div className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelLabel}>Recent seller orders</span>
              <h2>Order stream tied to your products</h2>
            </div>
            <span className={styles.panelMeta}>
              {isLoadingOrders ? 'Syncing orders...' : `${orders.length} seller orders`}
            </span>
          </div>

          {statusSummary.length ? (
            <div className={styles.statusRow}>
              {statusSummary.map((item) => (
                <span key={item.status} className={styles.summaryChip}>
                  {formatStatusLabel(item.status)}: {item.count}
                </span>
              ))}
            </div>
          ) : null}

          <div className={styles.orderList}>
            {isLoadingOrders
              ? Array.from({ length: 3 }).map((_, index) => <article key={index} className={styles.orderSkeleton} />)
              : orders.slice(0, 6).map((order) => (
                  <article key={order._id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <div>
                        <strong>{getUserDisplayName(order.user)}</strong>
                        <span>{order.user?.email || 'Customer account'}</span>
                      </div>
                      <div className={styles.badgeStack}>
                        <span className={`${styles.statusBadge} ${styles.statusNeutral}`}>
                          {formatStatusLabel(order.status)}
                        </span>
                        <span
                          className={`${styles.statusBadge} ${getPaymentBadgeClass(
                            order.paymentStatus,
                            styles
                          )}`}
                        >
                          {formatStatusLabel(order.paymentStatus)}
                        </span>
                      </div>
                    </div>

                    <div className={styles.orderMeta}>
                      <div>
                        <span>Order value</span>
                        <strong>
                          {formatCurrency(
                            getOrderValue(order),
                            order.paymentAmount?.currency || order.totalPrice?.currency || 'INR'
                          )}
                        </strong>
                      </div>
                      <div>
                        <span>Created</span>
                        <strong>{formatDateTime(order.createdAt)}</strong>
                      </div>
                      <div>
                        <span>Items</span>
                        <strong>{order.items.length}</strong>
                      </div>
                    </div>

                    <div className={styles.itemChips}>
                      {order.items.slice(0, 4).map((item) => (
                        <span key={`${order._id}-${item.product}`}>
                          {item.quantity} x{' '}
                          {productNameById[String(item.product)] || `Product ${String(item.product).slice(-6)}`}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}

            {!isLoadingOrders && orders.length === 0 ? (
              <div className={styles.emptyPanel}>
                <h3>No seller orders yet</h3>
                <p>Orders will appear here as soon as customers start checking out your products.</p>
              </div>
            ) : null}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelLabel}>Catalog focus</span>
              <h2>Top sellers and live listings</h2>
            </div>
            <span className={styles.panelMeta}>
              {isLoadingProducts ? 'Refreshing catalog...' : `${dashboardProducts.length} mirrored listings`}
            </span>
          </div>

          <div className={styles.topList}>
            {isLoadingMetrics
              ? Array.from({ length: 3 }).map((_, index) => <div key={index} className={styles.topSkeleton} />)
              : metrics.topProducts?.map((product) => (
                  <div key={product.id} className={styles.topRow}>
                    <div>
                      <strong>{product.title}</strong>
                      <span>Best-selling seller item</span>
                    </div>
                    <span className={styles.topBadge}>{product.sold} sold</span>
                  </div>
                ))}

            {!isLoadingMetrics && (!metrics.topProducts || metrics.topProducts.length === 0) ? (
              <div className={styles.emptyPanel}>
                <h3>No top-product data yet</h3>
                <p>As soon as orders begin clearing, your best performers will show up here.</p>
              </div>
            ) : null}
          </div>

          <div className={styles.syncGrid}>
            {recentCatalog.map((product) => (
              <div key={product._id} className={styles.syncCard}>
                <img src={getProductImage(product)} alt={product.title} />
                <div>
                  <strong>{product.title}</strong>
                  <span>{formatProductCategory(product.category)}</span>
                  <span>{formatCurrency(product.price?.amount, product.price?.currency || 'INR')}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className={styles.panel} id="inventory-editor">
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelLabel}>Inventory editor</span>
            <h2>Live product management</h2>
          </div>
          <span className={styles.panelMeta}>
            {productLoading ? 'Refreshing inventory...' : `${sellerProducts.length} editable listings`}
          </span>
        </div>

        <div className={styles.inventoryGrid}>
          {productLoading
            ? Array.from({ length: 2 }).map((_, index) => <article key={index} className={styles.inventorySkeleton} />)
            : sellerProducts.map((product) => {
                const draft = drafts[product._id] || {
                  title: product.title,
                  category: product.category || '',
                  description: getProductDescriptionText(product.description),
                  priceAmount: product.price?.amount || 0,
                  stock: product.stock || 0,
                }

                return (
                  <article key={product._id} className={styles.inventoryCard}>
                    <div className={styles.inventoryMedia}>
                      <img src={getProductImage(product)} alt={product.title} />
                      <span className={styles.inventoryBadge}>
                        {Number(product.stock || 0) > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>

                    <div className={styles.inventoryBody}>
                      <label className={styles.fieldBlock}>
                        <span>Title</span>
                        <input
                          type="text"
                          value={draft.title || ''}
                          onChange={(event) => updateDraft(product._id, 'title', event.target.value)}
                        />
                      </label>

                      <label className={styles.fieldBlock}>
                        <span>Category</span>
                        <input
                          type="text"
                          value={draft.category || ''}
                          onChange={(event) => updateDraft(product._id, 'category', event.target.value)}
                        />
                      </label>

                      <label className={styles.fieldBlock}>
                        <span>Description</span>
                        <textarea
                          value={draft.description || ''}
                          onChange={(event) => updateDraft(product._id, 'description', event.target.value)}
                        />
                      </label>

                      <div className={styles.inlineFields}>
                        <label className={styles.fieldBlock}>
                          <span>Price</span>
                          <input
                            type="number"
                            min="0"
                            value={draft.priceAmount || 0}
                            onChange={(event) => updateDraft(product._id, 'priceAmount', event.target.value)}
                          />
                        </label>

                        <label className={styles.fieldBlock}>
                          <span>Stock</span>
                          <input
                            type="number"
                            min="0"
                            value={draft.stock || 0}
                            onChange={(event) => updateDraft(product._id, 'stock', event.target.value)}
                          />
                        </label>
                      </div>

                      <div className={styles.cardActions}>
                        <button
                          className={styles.primaryButton}
                          onClick={() => handleSave(product._id)}
                          disabled={savingProductId === product._id}
                        >
                          {savingProductId === product._id ? 'Saving...' : 'Save changes'}
                        </button>
                        <button
                          className={styles.dangerButton}
                          onClick={() => handleDelete(product._id)}
                          disabled={deletingProductId === product._id}
                        >
                          {deletingProductId === product._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
        </div>

        {!productLoading && sellerProducts.length === 0 ? (
          <div className={styles.emptyPanel}>
            <h3>No seller products yet</h3>
            <p>Create your first listing to activate seller metrics and live inventory controls.</p>
          </div>
        ) : null}
      </article>
    </section>
  )
}
