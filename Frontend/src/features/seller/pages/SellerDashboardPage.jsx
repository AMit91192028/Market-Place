import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { deleteProduct, getSellerProducts, updateProduct } from '../../../services/api/productApi'
import {
  getSellerDashboardProducts,
  getSellerMetrics,
  getSellerOrders,
} from '../../../services/api/sellerDashboardApi'
import {
  formatCurrency,
  formatDateTime,
  formatStatusLabel,
  getOrderValue,
  getProductImage,
  getUserDisplayName,
} from '../../../utils/marketplace'
import styles from '../styles/SellerDashboard.module.css'

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

export default function SellerDashboardPage() {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { sellerProducts, isLoading: productLoading } = useSelector((state) => state.product)
  const {
    metrics,
    orders,
    products: dashboardProducts,
    isLoadingMetrics,
    isLoadingOrders,
    isLoadingProducts,
    error,
  } = useSelector((state) => state.sellerDashboard)
  const [drafts, setDrafts] = useState({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    dispatch(getSellerMetrics())
    dispatch(getSellerOrders())
    dispatch(getSellerDashboardProducts())
    dispatch(getSellerProducts())
  }, [dispatch])

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
      syncedListings: dashboardProducts.length,
    }
  }, [dashboardProducts.length, sellerProducts])

  function updateDraft(productId, field, value) {
    setDrafts((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        [field]: value,
      },
    }))
  }

  async function refreshDashboard() {
    await Promise.all([
      dispatch(getSellerMetrics()),
      dispatch(getSellerOrders()),
      dispatch(getSellerDashboardProducts()),
      dispatch(getSellerProducts()),
    ])
  }

  async function handleSave(productId) {
    const sourceProduct = sellerProducts.find((product) => product._id === productId)
    const draft = drafts[productId] || {
      title: sourceProduct?.title || '',
      description: sourceProduct?.description || '',
      priceAmount: sourceProduct?.price?.amount || 0,
      stock: sourceProduct?.stock || 0,
    }

    try {
      await dispatch(
        updateProduct({
          productId,
          data: {
            title: draft.title,
            description: draft.description,
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
    }
  }

  async function handleDelete(productId) {
    try {
      await dispatch(deleteProduct(productId)).unwrap()
      setMessage('Product deleted and seller dashboard refreshed.')
      await refreshDashboard()
    } catch (deleteError) {
      setMessage(deleteError || 'Unable to delete this product.')
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Seller dashboard service</span>
          <h1>Run your storefront, paid orders, and inventory from one responsive command center.</h1>
          <p>
            The seller studio now blends seller-dashboard insights with live product editing, so
            you can track revenue, payment state, and stock without bouncing between tools.
          </p>

          <div className={styles.heroActions}>
            <Link to="/seller/products/new" className={styles.primaryButton}>
              Launch new listing
            </Link>
            <a href="#inventory-editor" className={styles.secondaryButton}>
              Jump to inventory
            </a>
          </div>

          <div className={styles.metricStrip}>
            <div className={styles.metricPill}>
              <strong>{metrics.paidOrders}</strong>
              <span>Paid orders tracked</span>
            </div>
            <div className={styles.metricPill}>
              <strong>{inventoryMetrics.syncedListings}</strong>
              <span>Listings mirrored in dashboard</span>
            </div>
            <div className={styles.metricPill}>
              <strong>{user?.email || 'seller@marketplace'}</strong>
              <span>Active seller account</span>
            </div>
          </div>
        </div>

        <div className={styles.heroPanel}>
          <span className={styles.panelLabel}>Snapshot</span>
          <div className={styles.heroHighlight}>
            <strong>{formatCurrency(metrics.revenue)}</strong>
            <span>Revenue recognized from paid or fulfilled orders</span>
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
              <span>Orders awaiting next step</span>
            </div>
            <div className={styles.heroTile}>
              <strong>{inventoryMetrics.stock}</strong>
              <span>Units in stock</span>
            </div>
          </div>
        </div>
      </div>

      {message ? <div className={styles.successBanner}>{message}</div> : null}
      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <div className={styles.overviewGrid}>
        <article className={styles.overviewCard}>
          <span>Revenue</span>
          <strong>{isLoadingMetrics ? 'Refreshing...' : formatCurrency(metrics.revenue)}</strong>
          <p>Backed by seller-dashboard metrics and completed payment sync.</p>
        </article>
        <article className={styles.overviewCard}>
          <span>Units sold</span>
          <strong>{isLoadingMetrics ? 'Refreshing...' : metrics.sales}</strong>
          <p>Calculated from order items that belong to your storefront.</p>
        </article>
        <article className={styles.overviewCard}>
          <span>Inventory value</span>
          <strong>{formatCurrency(inventoryMetrics.stockValue)}</strong>
          <p>Live stock position from the product service editor below.</p>
        </article>
        <article className={styles.overviewCard}>
          <span>Catalog sync</span>
          <strong>
            {inventoryMetrics.syncedListings}/{inventoryMetrics.listings}
          </strong>
          <p>Seller-dashboard mirror compared with editable product records.</p>
        </article>
      </div>

      <div className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelLabel}>Recent orders</span>
              <h2>Payment-aware order stream</h2>
            </div>
            <span className={styles.panelMeta}>
              {isLoadingOrders ? 'Syncing orders...' : `${orders.length} orders`}
            </span>
          </div>

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
                      {item.quantity} x {productNameById[String(item.product)] || `Product ${String(item.product).slice(-6)}`}
                    </span>
                  ))}
                </div>
              </article>
                ))}

            {!isLoadingOrders && orders.length === 0 ? (
              <div className={styles.emptyPanel}>
                <h3>No seller orders yet</h3>
                <p>Orders will appear here as soon as customers start checking out.</p>
              </div>
            ) : null}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelLabel}>Catalog intelligence</span>
              <h2>Top movers and synced products</h2>
            </div>
            <span className={styles.panelMeta}>
              {isLoadingProducts ? 'Syncing catalog...' : `${dashboardProducts.length} mirrored products`}
            </span>
          </div>

          <div className={styles.topList}>
            {isLoadingMetrics
              ? Array.from({ length: 3 }).map((_, index) => <div key={index} className={styles.topSkeleton} />)
              : metrics.topProducts?.map((product) => (
              <div key={product.id} className={styles.topRow}>
                <div>
                  <strong>{product.title}</strong>
                  <span>Best selling item</span>
                </div>
                <span className={styles.topBadge}>{product.sold} sold</span>
              </div>
                ))}

            {!isLoadingMetrics && (!metrics.topProducts || metrics.topProducts.length === 0) ? (
              <div className={styles.emptyPanel}>
                <h3>No top-product data yet</h3>
                <p>Once payments begin clearing, your best performers will surface here.</p>
              </div>
            ) : null}
          </div>

          <div className={styles.syncGrid}>
            {dashboardProducts.slice(0, 4).map((product) => (
              <div key={product._id} className={styles.syncCard}>
                <img src={getProductImage(product)} alt={product.title} />
                <div>
                  <strong>{product.title}</strong>
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
              description: product.description || '',
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
                    <button className={styles.primaryButton} onClick={() => handleSave(product._id)}>
                      Save changes
                    </button>
                    <button className={styles.dangerButton} onClick={() => handleDelete(product._id)}>
                      Delete
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
            <p>Create your first listing to activate the seller dashboard and payment-linked insights.</p>
          </div>
        ) : null}
      </article>
    </section>
  )
}
