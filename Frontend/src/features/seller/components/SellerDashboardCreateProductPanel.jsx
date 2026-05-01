export default function SellerDashboardCreateProductPanel({
  styles,
  createDraft,
  updateCreateDraft,
  handleCreateSubmit,
  isPublishing,
  setComposerOpen,
}) {
  return (
    <article className={`${styles.panel} ${styles.createComposer}`} id="seller-create-form">
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.panelLabel}>Add product</span>
          <h2>Create a new seller listing</h2>
        </div>
        <span className={styles.panelMeta}>Description is sent as plain text.</span>
      </div>

      <form className={styles.createForm} onSubmit={handleCreateSubmit}>
        <label className={styles.fieldBlock}>
          <span>Product title</span>
          <input
            type="text"
            value={createDraft.title}
            onChange={(event) => updateCreateDraft('title', event.target.value)}
            required
          />
        </label>

        <label className={styles.fieldBlock}>
          <span>Category</span>
          <input
            type="text"
            placeholder="Ex: electronics, fashion, home"
            value={createDraft.category}
            onChange={(event) => updateCreateDraft('category', event.target.value)}
            required
          />
        </label>

        <label className={styles.fieldBlock}>
          <span>Description</span>
          <textarea
            placeholder="Write a short product description"
            value={createDraft.description}
            onChange={(event) => updateCreateDraft('description', event.target.value)}
          />
        </label>

        <div className={styles.inlineFields}>
          <label className={styles.fieldBlock}>
            <span>Price amount</span>
            <input
              type="number"
              min="1"
              value={createDraft.priceAmount}
              onChange={(event) => updateCreateDraft('priceAmount', event.target.value)}
              required
            />
          </label>

          <label className={styles.fieldBlock}>
            <span>Currency</span>
            <select
              value={createDraft.priceCurrency}
              onChange={(event) => updateCreateDraft('priceCurrency', event.target.value)}
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
            </select>
          </label>

          <label className={styles.fieldBlock}>
            <span>Stock</span>
            <input
              type="number"
              min="0"
              value={createDraft.stock}
              onChange={(event) => updateCreateDraft('stock', event.target.value)}
              required
            />
          </label>
        </div>

        <label className={styles.fieldBlock}>
          <span>Images</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => updateCreateDraft('images', Array.from(event.target.files || []))}
          />
        </label>

        <div className={styles.cardActions}>
          <button type="submit" className={styles.primaryButton} disabled={isPublishing}>
            {isPublishing ? 'Publishing...' : 'Publish product'}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => setComposerOpen(false)}>
            Cancel
          </button>
        </div>
      </form>
    </article>
  )
}
