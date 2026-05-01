export default function SellerDashboardOrdersPanel({
  styles,
  orders,
  isLoadingOrders,
  formatStatusLabel,
  formatDateTime,
  formatCurrency,
  getOrderValue,
  getUserDisplayName,
  getPaymentBadgeClass,
  productNameById,
}) {
  return (
    <article className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.panelEyebrow}>Seller Orders</span>
          <h2>Orders from seller-dashboard service</h2>
        </div>
        <span className={styles.panelMeta}>
          {isLoadingOrders ? 'Loading orders...' : `${orders.length} seller orders`}
        </span>
      </div>

      <div className={styles.feedList}>
        {isLoadingOrders
          ? Array.from({ length: 3 }).map((_, index) => <div key={index} className={styles.loadingCard} />)
          : orders.slice(0, 6).map((order) => (
              <article key={order._id} className={styles.feedCard}>
                <div className={styles.feedHeader}>
                  <div>
                    <strong>{getUserDisplayName(order.user)}</strong>
                    <span>{order.user?.email || 'Customer account'}</span>
                  </div>

                  <div className={styles.badgeRow}>
                    <span className={styles.neutralBadge}>{formatStatusLabel(order.status)}</span>
                    <span className={getPaymentBadgeClass(order.paymentStatus, styles)}>
                      {formatStatusLabel(order.paymentStatus)}
                    </span>
                  </div>
                </div>

                <div className={styles.feedMeta}>
                  <div>
                    <span>Value</span>
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
                    <strong>{order.items?.length || 0}</strong>
                  </div>
                </div>

                <div className={styles.itemChipRow}>
                  {(order.items || []).slice(0, 4).map((item) => (
                    <span key={`${order._id}-${item.product}`} className={styles.itemChip}>
                      {item.quantity} x {productNameById[String(item.product)] || `Product ${String(item.product).slice(-6)}`}
                    </span>
                  ))}
                </div>
              </article>
            ))}

        {!isLoadingOrders && orders.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No seller orders yet</h3>
            <p>Orders connected to your products will appear here automatically.</p>
          </div>
        ) : null}
      </div>
    </article>
  )
}
