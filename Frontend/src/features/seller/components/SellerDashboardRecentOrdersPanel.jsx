export default function SellerDashboardRecentOrdersPanel({
  styles,
  isLoadingOrders,
  orders,
  statusSummary,
  formatStatusLabel,
  getUserDisplayName,
  getPaymentBadgeClass,
  formatCurrency,
  getOrderValue,
  formatDateTime,
  productNameById,
}) {
  return (
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
                    <span className={`${styles.statusBadge} ${getPaymentBadgeClass(order.paymentStatus, styles)}`}>
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
            <p>Orders will appear here as soon as customers start checking out your products.</p>
          </div>
        ) : null}
      </div>
    </article>
  )
}
