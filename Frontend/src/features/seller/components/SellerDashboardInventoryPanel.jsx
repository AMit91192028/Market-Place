import { getProductImage } from '../../../utils/marketplace'

export default function SellerDashboardInventoryPanel({
  styles,
  sellerProducts,
  drafts,
  productLoading,
  savingProductId,
  deletingProductId,
  updateDraft,
  handleSave,
  handleDelete,
  getProductDescriptionText,
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
          {productLoading ? 'Loading inventory...' : `${sellerProducts.length} editable listings`}
        </span>
      </div>

      <div className={styles.inventoryGrid}>
        {productLoading
          ? Array.from({ length: 2 }).map((_, index) => <div key={index} className={styles.loadingCard} />)
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
                  </div>

                  <div className={styles.inventoryBody}>
                    <div className={styles.inventoryTitleRow}>
                      <div>
                        <strong>{product.title}</strong>
                        <span>{formatProductCategory(product.category)}</span>
                      </div>
                      <span className={Number(product.stock || 0) > 0 ? styles.liveBadge : styles.outBadge}>
                        {Number(product.stock || 0) > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>

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
                        rows="4"
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

                    <div className={styles.inventoryFooter}>
                      <strong>{formatCurrency(product.price?.amount, product.price?.currency || 'INR')}</strong>
                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          className={styles.primaryButton}
                          disabled={savingProductId === product._id}
                          onClick={() => handleSave(product._id)}
                        >
                          {savingProductId === product._id ? 'Saving...' : 'Save changes'}
                        </button>
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
                  </div>
                </article>
              )
            })}
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
