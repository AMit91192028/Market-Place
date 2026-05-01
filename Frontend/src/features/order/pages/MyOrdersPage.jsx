import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { cancelOrder, getMyOrders } from '../../../services/api/orderApi'
import { formatAddress, formatCurrency } from '../../../utils/marketplace'
import styles from '../styles/Order.module.css'

export default function MyOrdersPage() {
  const dispatch = useDispatch()
  const { orders, error, isLoading } = useSelector((state) => state.order)

  useEffect(() => {
    dispatch(getMyOrders())
  }, [dispatch])

  async function handleCancel(orderId) {
    await dispatch(cancelOrder(orderId)).unwrap()
  }

  return (
    <section className={styles.page}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>Customer orders</span>
          <h1>Your order timeline</h1>
          <p>Track every order created from the live order service and cancel pending ones from here.</p>
        </div>
      </div>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      {isLoading ? (
        <div className={styles.orderGrid}>
          {Array.from({ length: 3 }).map((_, index) => (
            <article key={index} className={styles.orderSkeleton} />
          ))}
        </div>
      ) : orders.length ? (
        <div className={styles.orderGrid}>
          {orders.map((order) => (
            <article key={order._id} className={styles.orderCard}>
              <div className={styles.orderCardHeader}>
                <div>
                  <strong>Order #{order._id.slice(-8)}</strong>
                  <span>{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <span className={styles.statusBadge}>{order.status}</span>
              </div>

              <div className={styles.orderMeta}>
                <span>{order.items.length} items</span>
                <span>{formatCurrency(order.totalPrice?.amount, order.totalPrice?.currency || 'INR')}</span>
              </div>

              <p className={styles.orderAddress}>{formatAddress(order.shippingAddress)}</p>

              <div className={styles.cardActions}>
                <Link to={`/orders/${order._id}`} className={styles.secondaryButton}>
                  View details
                </Link>
                {order.status === 'PENDING' ? (
                  <button className={styles.dangerButton} onClick={() => handleCancel(order._id)}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2>No orders yet</h2>
          <p>Once you place an order from checkout it will show up here.</p>
          <Link to="/products" className={styles.primaryButton}>
            Start shopping
          </Link>
        </div>
      )}
    </section>
  )
}
