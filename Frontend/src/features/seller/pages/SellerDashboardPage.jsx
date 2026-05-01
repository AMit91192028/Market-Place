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
  formatProductCategory,
  formatStatusLabel,
  getOrderValue,
  getProductImage,
  getUserDisplayName,
  normalizeProductDescriptionInput,
  toProductDescriptionTextarea,
} from '../../../utils/marketplace'
import SellerDashboardCreateProductPanel from '../components/SellerDashboardCreateProductPanel'
import SellerDashboardInventoryPanel from '../components/SellerDashboardInventoryPanel'
import SellerDashboardOrdersPanel from '../components/SellerDashboardOrdersPanel'
import styles from '../styles/SellerDashboard.module.css'

const LIVE_REFRESH_MS = 30000

function getPaymentBadgeClass(status, cssModule) {
  switch (status) {
    case 'COMPLETED':
      return cssModule.successBadge
    case 'PENDING':
      return cssModule.pendingBadge
    case 'FAILED':
      return cssModule.failedBadge
    default:
      return cssModule.neutralBadge
  }
}

function hasRefreshFailures(results = []) {
  return results.some((result) => result.status === 'rejected')
}

function getProductDescriptionText(description) {
  return toProductDescriptionTextarea(description)
}

export default function SellerDashboardPage() {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const [drafts, setDrafts] = useState({})
  const [message, setMessage] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [savingProductId, setSavingProductId] = useState('')
  const [deletingProductId, setDeletingProductId] = useState('')
  const [localActionError, setLocalActionError] = useState('')

  const { user } = useSelector((state) => state.auth)
  const { sellerProducts, isLoading: productLoading, error: productError } = useSelector((state) => state.product)
  const {
    metrics,
    orders,
    products: mirroredProducts,
    isLoadingMetrics,
    isLoadingOrders,
    isLoadingProducts,
    error: sellerDashboardError,
  } = useSelector((state) => state.sellerDashboard)

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

    return () => window.clearInterval(intervalId)
  }, [refreshDashboard])

  const productNameById = useMemo(() => {
    return [...mirroredProducts, ...sellerProducts].reduce((result, product) => {
      result[String(product._id)] = product.title
      return result
    }, {})
  }, [mirroredProducts, sellerProducts])

  const inventoryMetrics = useMemo(() => {
    return {
      listings: sellerProducts.length,
      stockUnits: sellerProducts.reduce((sum, product) => sum + Number(product.stock || 0), 0),
      stockValue: sellerProducts.reduce(
        (sum, product) => sum + Number(product.stock || 0) * Number(product.price?.amount || 0),
        0
      ),
      outOfStock: sellerProducts.filter((product) => Number(product.stock || 0) <= 0).length,
    }
  }, [sellerProducts])

  const recentMirroredProducts = useMemo(() => {
    const source = mirroredProducts.length ? mirroredProducts : sellerProducts
    return source.slice(0, 4)
  }, [mirroredProducts, sellerProducts])

  const isRefreshing = isLoadingMetrics || isLoadingOrders || isLoadingProducts || productLoading
  const dashboardError = localActionError || sellerDashboardError || productError

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
    setLocalActionError('')
    setMessage('')

    const formData = new FormData()
    formData.append('title', String(values.title || '').trim())
    formData.append('category', String(values.category || '').trim())
    formData.append('description', normalizeProductDescriptionInput(values.description))
    formData.append('priceAmount', String(values.priceAmount ?? ''))
    formData.append('priceCurrency', String(values.priceCurrency || 'INR'))
    formData.append('stock', String(values.stock ?? 0))

    Array.from(values.images || []).forEach((file) => {
      formData.append('images', file)
    })

    try {
      const createdProduct = await dispatch(createProduct(formData)).unwrap()
      const createdTitle = createdProduct?.title || 'Product'

      setMessage(`${createdTitle} created successfully.`)
      setComposerOpen(false)
      void refreshDashboard().then((results) => {
        if (hasRefreshFailures(results)) {
          setMessage(`${createdTitle} created successfully. Some dashboard cards are still refreshing.`)
        }
      })
    } catch (error) {
      setLocalActionError(error || 'Unable to create product.')
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
    setLocalActionError('')
    setMessage('')

    try {
      await dispatch(
        updateProduct({
          productId,
          data: {
            title: String(draft.title || '').trim(),
            category: String(draft.category || '').trim(),
            description: normalizeProductDescriptionInput(draft.description),
            stock: Number(draft.stock || 0),
            price: {
              amount: Number(draft.priceAmount || 0),
              currency: sourceProduct?.price?.currency || 'INR',
            },
          },
        })
      ).unwrap()

      setMessage('Product updated successfully.')
      void refreshDashboard()
    } catch (error) {
      setLocalActionError(error || 'Unable to update product.')
    } finally {
      setSavingProductId('')
    }
  }

  async function handleDelete(productId) {
    setDeletingProductId(productId)
    setLocalActionError('')
    setMessage('')

    try {
      await dispatch(deleteProduct(productId)).unwrap()
      setMessage('Product deleted successfully.')
      void refreshDashboard()
    } catch (error) {
      setLocalActionError(error || 'Unable to delete product.')
    } finally {
      setDeletingProductId('')
    }
  }

  return (
    <section className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Seller Workspace</span>
          <h1>Run storefront operations with seller-dashboard and product services together.</h1>
          <p>
            This view reads seller metrics, orders, and mirrored catalog data from the seller-dashboard
            service while product creation and inventory changes go straight to the product service.
          </p>

          <div className={styles.heroActions}>
            <button type="button" className={styles.primaryButton} onClick={() => setComposerOpen(!isComposerOpen)}>
              {isComposerOpen ? 'Close product form' : 'Create new product'}
            </button>
            <a href="#inventory-editor" className={styles.secondaryButton}>
              Manage inventory
            </a>
          </div>

          <div className={styles.metricStrip}>
            <div className={styles.metricPill}>
              <strong>{inventoryMetrics.listings}</strong>
              <span>Active product-service listings</span>
            </div>
            <div className={styles.metricPill}>
              <strong>{metrics.totalOrders}</strong>
              <span>Orders from seller-dashboard</span>
            </div>
            <div className={styles.metricPill}>
              <strong>{user?.email || 'seller@marketplace'}</strong>
              <span>Seller account in session</span>
            </div>
          </div>
        </div>

        <div className={styles.heroPanel}>
          <div className={styles.panelHeaderCompact}>
            <span className={styles.panelEyebrow}>Live Snapshot</span>
            <span className={styles.liveChip}>{isRefreshing ? 'Refreshing...' : 'Auto-refresh every 30s'}</span>
          </div>

          <div className={styles.heroRevenue}>
            <strong>{formatCurrency(metrics.revenue)}</strong>
            <span>Revenue recognized from paid or fulfilled seller orders</span>
          </div>

          <div className={styles.heroGrid}>
            <div className={styles.heroTile}>
              <strong>{metrics.sales}</strong>
              <span>Units sold</span>
            </div>
            <div className={styles.heroTile}>
              <strong>{metrics.pendingOrders}</strong>
              <span>Pending orders</span>
            </div>
            <div className={styles.heroTile}>
              <strong>{inventoryMetrics.stockUnits}</strong>
              <span>Units in stock</span>
            </div>
            <div className={styles.heroTile}>
              <strong>{inventoryMetrics.outOfStock}</strong>
              <span>Out of stock</span>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.liveBar}>
        <div className={styles.liveIndicator}>
          <span className={styles.liveDot} />
          <strong>Seller services connected</strong>
        </div>
        <span>{lastUpdatedAt ? `Last synced ${formatDateTime(lastUpdatedAt)}` : 'Preparing seller snapshot...'}</span>
      </div>

      {message ? <div className={styles.successBanner}>{message}</div> : null}
      {dashboardError ? <div className={styles.errorBanner}>{dashboardError}</div> : null}

      {isComposerOpen ? (
        <SellerDashboardCreateProductPanel
          styles={styles}
          onSubmit={handleCreateSubmit}
          isPublishing={isPublishing}
          onCancel={() => setComposerOpen(false)}
        />
      ) : null}

      <div className={styles.overviewGrid}>
        <article className={styles.overviewCard}>
          <span>Seller revenue</span>
          <strong>{formatCurrency(metrics.revenue)}</strong>
          <p>Read from seller-dashboard metrics.</p>
        </article>
        <article className={styles.overviewCard}>
          <span>Units sold</span>
          <strong>{metrics.sales}</strong>
          <p>Calculated from orders containing your products.</p>
        </article>
        <article className={styles.overviewCard}>
          <span>Inventory value</span>
          <strong>{formatCurrency(inventoryMetrics.stockValue)}</strong>
          <p>Derived from live product-service inventory.</p>
        </article>
        <article className={styles.overviewCard}>
          <span>Paid orders</span>
          <strong>{metrics.paidOrders}</strong>
          <p>Orders with completed payments in seller-dashboard.</p>
        </article>
      </div>

      <div className={styles.contentGrid}>
        <SellerDashboardOrdersPanel
          styles={styles}
          orders={orders}
          isLoadingOrders={isLoadingOrders}
          formatStatusLabel={formatStatusLabel}
          formatDateTime={formatDateTime}
          formatCurrency={formatCurrency}
          getOrderValue={getOrderValue}
          getUserDisplayName={getUserDisplayName}
          getPaymentBadgeClass={getPaymentBadgeClass}
          productNameById={productNameById}
        />

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Mirrored Catalog</span>
              <h2>Seller-dashboard service product mirror</h2>
            </div>
            <span className={styles.panelMeta}>
              {isLoadingProducts ? 'Loading mirrored products...' : `${mirroredProducts.length} mirrored listings`}
            </span>
          </div>

          <div className={styles.topList}>
            {metrics.topProducts?.length ? (
              metrics.topProducts.map((product) => (
                <div key={product.id} className={styles.topRow}>
                  <div>
                    <strong>{product.title}</strong>
                    <span>Best-performing seller item</span>
                  </div>
                  <span className={styles.topBadge}>{product.sold} sold</span>
                </div>
              ))
            ) : (
              <div className={styles.emptyStateCompact}>
                <strong>No top products yet</strong>
                <span>Top sellers will appear here after product-linked orders are created.</span>
              </div>
            )}
          </div>

          <div className={styles.catalogPreviewGrid}>
            {recentMirroredProducts.map((product) => (
              <article key={product._id} className={styles.previewCard}>
                <img src={getProductImage(product)} alt={product.title} />
                <div>
                  <strong>{product.title}</strong>
                  <span>{formatProductCategory(product.category)}</span>
                  <span>{formatCurrency(product.price?.amount, product.price?.currency || 'INR')}</span>
                </div>
              </article>
            ))}
          </div>

          {!isLoadingProducts && recentMirroredProducts.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No mirrored products yet</h3>
              <p>Product events from the product service will surface here through seller-dashboard.</p>
            </div>
          ) : null}
        </article>
      </div>

      <SellerDashboardInventoryPanel
        styles={styles}
        sellerProducts={sellerProducts}
        drafts={drafts}
        productLoading={productLoading}
        savingProductId={savingProductId}
        deletingProductId={deletingProductId}
        updateDraft={updateDraft}
        handleSave={handleSave}
        handleDelete={handleDelete}
        getProductDescriptionText={getProductDescriptionText}
        formatCurrency={formatCurrency}
        formatProductCategory={formatProductCategory}
      />
    </section>
  )
}
