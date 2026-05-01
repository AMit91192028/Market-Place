import { getProductImage } from '../../../utils/marketplace'

export default function SellerDashboardInventoryPanel({
  styles,
  productLoading,
  sellerProducts,
  drafts,
  updateDraft,
  handleSave,
  handleDelete,
  savingProductId,
  deletingProductId,
  getProductDescriptionText,
}) {
  return (
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
  )
}
