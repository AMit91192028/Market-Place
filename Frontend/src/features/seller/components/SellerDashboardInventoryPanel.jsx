import { Link } from 'react-router-dom'
import { getProductImage } from '../../../utils/marketplace'

export default function SellerDashboardInventoryPanel({
  styles,
  sellerProducts,
  productLoading,
  deletingProductId,
  handleDelete,
  formatCurrency,
  formatProductCategory,
}) {
  return (
    <article className={styles.panel} id="inventory-editor">
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.panelEyebrow}>Product Service</span>
          <h2>Manage live inventory</h2>
        </div>
        <span className={styles.panelMeta}>
          {productLoading ? 'Loading inventory...' : `${sellerProducts.length} live listings`}
        </span>
      </div>

      <div className={styles.inventoryGrid}>
        {productLoading
          ? Array.from({ length: 4 }).map((_, index) => <div key={index} className={styles.loadingCard} />)
          : sellerProducts.map((product) => (
              <article key={product._id} className={styles.inventoryCard}>
                <div className={styles.inventoryMedia}>
                  <img src={getProductImage(product)} alt={product.title} />
                  <span className={Number(product.stock || 0) > 0 ? styles.liveBadge : styles.outBadge}>
                    {Number(product.stock || 0) > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>

                <div className={styles.inventoryBody}>
                  <div className={styles.inventoryCopy}>
                    <span className={styles.inventoryCategory}>{formatProductCategory(product.category)}</span>
                    <strong>{product.title}</strong>
                    <p className={styles.inventoryPrice}>
                      {formatCurrency(product.price?.amount, product.price?.currency || 'INR')}
                    </p>
                  </div>

                  <div className={styles.inventoryActionRow}>
                    <Link to={`/seller/products/${product._id}/edit`} className={styles.secondaryButton}>
                      Update
                    </Link>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      disabled={deletingProductId === product._id}
                      onClick={() => handleDelete(product._id)}
                    >
                      {deletingProductId === product._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
      </div>

      {!productLoading && sellerProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No seller products yet</h3>
          <p>Create your first listing to populate product service inventory here.</p>
        </div>
      ) : null}
    </article>
  )
}
