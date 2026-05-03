import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import {
  deleteProduct,
  getSellerProducts,
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
} from '../../../utils/marketplace'
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

function mergeProductsById(primaryProducts = [], secondaryProducts = []) {
  const mergedProducts = new Map()

  secondaryProducts.forEach((product) => {
    if (product?._id) {
      mergedProducts.set(String(product._id), product)
    }
  })

  primaryProducts.forEach((product) => {
    if (product?._id) {
      mergedProducts.set(String(product._id), product)
    }
  })

  return Array.from(mergedProducts.values()).sort((left, right) => {
    return new Date(right?.createdAt || 0).getTime() - new Date(left?.createdAt || 0).getTime()
  })
}

export default function SellerDashboardPage() {
  const dispatch = useDispatch()
  const [message, setMessage] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
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

  useEffect(() => {
    async function runDashboardRefresh() {
      await Promise.allSettled([
        dispatch(getSellerMetrics()).unwrap(),
        dispatch(getSellerOrders()).unwrap(),
        dispatch(getSellerDashboardProducts()).unwrap(),
        dispatch(getSellerProducts()).unwrap(),
      ])

      setLastUpdatedAt(new Date().toISOString())
    }

    void runDashboardRefresh()

    const intervalId = window.setInterval(() => {
      void runDashboardRefresh()
    }, LIVE_REFRESH_MS)

    return () => window.clearInterval(intervalId)
  }, [dispatch])

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

  const mergedCatalogProducts = useMemo(() => {
    return mergeProductsById(sellerProducts, mirroredProducts)
  }, [mirroredProducts, sellerProducts])

  const recentMirroredProducts = useMemo(() => {
    return mergedCatalogProducts.slice(0, 4)
  }, [mergedCatalogProducts])

  const mirrorStatusLabel = useMemo(() => {
    if (isLoadingProducts && mergedCatalogProducts.length > 0) {
      return `Refreshing mirror, showing ${mergedCatalogProducts.length} live listings`
    }

    if (mirroredProducts.length > 0) {
      return `${mirroredProducts.length} mirrored listings`
    }

    if (sellerProducts.length > 0) {
      return `Showing ${sellerProducts.length} product-service listings`
    }

    return isLoadingProducts ? 'Loading seller products...' : 'No synced listings yet'
  }, [isLoadingProducts, mergedCatalogProducts.length, mirroredProducts.length, sellerProducts.length])

  const isRefreshing = isLoadingMetrics || isLoadingOrders || isLoadingProducts || productLoading
  const dashboardError = localActionError || sellerDashboardError || productError

  async function refreshSellerReadModels() {
    await Promise.allSettled([
      dispatch(getSellerMetrics()).unwrap(),
      dispatch(getSellerOrders()).unwrap(),
      dispatch(getSellerDashboardProducts()).unwrap(),
      dispatch(getSellerProducts()).unwrap(),
    ])

    setLastUpdatedAt(new Date().toISOString())
  }

  async function handleDelete(productId) {
    const productToDelete = sellerProducts.find((product) => product._id === productId)
    const shouldDelete =
      typeof window === 'undefined'
        ? true
        : window.confirm(`Delete "${productToDelete?.title || 'this product'}" from the product service?`)

    if (!shouldDelete) {
      return
    }

    setDeletingProductId(productId)
    setLocalActionError('')
    setMessage('')

    try {
      await dispatch(deleteProduct(productId)).unwrap()
      toast.success('Product deleted successfully.')
      setMessage('Product deleted successfully.')
      await refreshSellerReadModels()
    } catch (error) {
      toast.error(error || 'Unable to delete product.')
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
            <Link
              to="/seller/products/new"
              target="_blank"
              rel="noreferrer"
              className={styles.primaryButton}
            >
              Create new product
            </Link>
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
            <span className={styles.panelMeta}>{mirrorStatusLabel}</span>
          </div>

          {recentMirroredProducts.length ? (
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
          ) : null}

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
            ) : recentMirroredProducts.length ? (
              <div className={styles.emptyStateCompact}>
                <strong>Products are available</strong>
                <span>
                  Orders have not ranked top sellers yet, but your current product-service listings are
                  shown above.
                </span>
              </div>
            ) : (
              <div className={styles.emptyStateCompact}>
                <strong>No top products yet</strong>
                <span>Top sellers will appear here after product-linked orders are created.</span>
              </div>
            )}
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
        productLoading={productLoading}
        deletingProductId={deletingProductId}
        handleDelete={handleDelete}
        formatCurrency={formatCurrency}
        formatProductCategory={formatProductCategory}
      />
    </section>
  )
}
