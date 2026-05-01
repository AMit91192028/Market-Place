import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  createProduct,
  deleteProduct,
  getSellerProducts,
  updateProduct,
} from '../../../services/api/productApi'
import {
  getSellerDashboardProducts,
  getSellerMetrics,
  getSellerOrders,
} from '../../../services/api/sellerDashboardApi'
import {
  formatCurrency,
  formatDateTime,
  normalizeProductDescriptionInput,
  formatProductCategory,
  formatStatusLabel,
  getOrderValue,
  getProductImage,
  getUserDisplayName,
} from '../../../utils/marketplace'
import SellerDashboardCreateProductPanel from '../components/SellerDashboardCreateProductPanel'
import SellerDashboardInventoryPanel from '../components/SellerDashboardInventoryPanel'
import SellerDashboardRecentOrdersPanel from '../components/SellerDashboardRecentOrdersPanel'
import styles from '../styles/SellerDashboard.module.css'

const LIVE_REFRESH_MS = 30000
const SELLER_ORDER_FLOW = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']

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

function getProductDescriptionText(description) {
  return typeof description === 'string' ? description : description || ''
}

function hasRefreshFailures(results = []) {
  return results.some((result) => result.status === 'rejected')
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
  const [message, setMessage] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [savingProductId, setSavingProductId] = useState('')
  const [deletingProductId, setDeletingProductId] = useState('')

  const isComposerOpen = searchParams.get('composer') === '1'
  const refreshDashboard = useEffectEvent(async () => {
    const results = await Promise.allSettled([
      dispatch(getSellerMetrics()).unwrap(),
      dispatch(getSellerOrders()).unwrap(),
      dispatch(getSellerDashboardProducts()).unwrap(),
      dispatch(getSellerProducts()).unwrap(),
    ])

    setLastUpdatedAt(new Date().toISOString())
    return results
  })

  useEffect(() => {
    void refreshDashboard()

    const intervalId = window.setInterval(() => {
      void refreshDashboard()
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

  const statusSummary = useMemo(() => {
    return SELLER_ORDER_FLOW.map((status) => ({
      status,
      count: orders.filter((order) => order.status === status).length,
    })).filter((item) => item.count > 0)
  }, [orders])

  const recentCatalog = useMemo(() => {
    return (dashboardProducts.length ? dashboardProducts : sellerProducts).slice(0, 4)
  }, [dashboardProducts, sellerProducts])
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
 
  async function handleCreateSubmit(values) {
    setIsPublishing(true)
    setMessage('')

    const formData = new FormData()
    formData.append('title', String(values.title || '').trim())
    formData.append('category', String(values.category || '').trim())
    formData.append('priceAmount', String(values.priceAmount ?? ''))
    formData.append('priceCurrency', String(values.priceCurrency || 'INR'))
    formData.append('stock', String(values.stock ?? 0))
    formData.append('description', normalizeProductDescriptionInput(values.description))

    Array.from(values.images || []).forEach((file) => {
      formData.append('images', file)
    })

    try {
      const createdProduct = await dispatch(createProduct(formData)).unwrap()
      const createdLabel = createdProduct?.title || 'Product'

      setMessage(`${createdLabel} created successfully.`)
      setComposerOpen(false)
      void refreshDashboard().then((refreshResults) => {
        if (hasRefreshFailures(refreshResults)) {
          setMessage(`${createdLabel} created successfully. Some dashboard panels are still refreshing.`)
        }
      })
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
            description: normalizeProductDescriptionInput(draft.description),
            stock: Number(draft.stock),
            price: {
              amount: Number(draft.priceAmount),
              currency: 'INR',
            },
          },
        })
      ).unwrap()

      const refreshResults = await refreshDashboard()
      setMessage(
        hasRefreshFailures(refreshResults)
          ? 'Inventory updated, but one or more dashboard panels are still refreshing.'
          : 'Inventory updated and seller dashboard refreshed.'
      )
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
      const refreshResults = await refreshDashboard()
      setMessage(
        hasRefreshFailures(refreshResults)
          ? 'Product deleted, but one or more dashboard panels are still refreshing.'
          : 'Product deleted and seller dashboard refreshed.'
      )
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
        <SellerDashboardCreateProductPanel
          styles={styles}
          handleCreateSubmit={handleCreateSubmit}
          isPublishing={isPublishing}
          setComposerOpen={setComposerOpen}
        />
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

      <div className={styles.contentGrid}>
        <SellerDashboardRecentOrdersPanel
          styles={styles}
          isLoadingOrders={isLoadingOrders}
          orders={orders}
          statusSummary={statusSummary}
          formatStatusLabel={formatStatusLabel}
          getUserDisplayName={getUserDisplayName}
          getPaymentBadgeClass={getPaymentBadgeClass}
          formatCurrency={formatCurrency}
          getOrderValue={getOrderValue}
          formatDateTime={formatDateTime}
          productNameById={productNameById}
        />

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

      <SellerDashboardInventoryPanel
        styles={styles}
        productLoading={productLoading}
        sellerProducts={sellerProducts}
        drafts={drafts}
        updateDraft={updateDraft}
        handleSave={handleSave}
        handleDelete={handleDelete}
        savingProductId={savingProductId}
        deletingProductId={deletingProductId}
        getProductDescriptionText={getProductDescriptionText}
      />
    </section>
  )
}
