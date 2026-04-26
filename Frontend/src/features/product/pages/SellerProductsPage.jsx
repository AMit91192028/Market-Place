import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { deleteProduct, getSellerProducts, updateProduct } from '../../../services/api/productApi'
import { formatCurrency, getProductImage } from '../../../utils/marketplace'
import styles from '../styles/Product.module.css'

export default function SellerProductsPage() {
  const dispatch = useDispatch()
  const { sellerProducts, isLoading, error } = useSelector((state) => state.product)
  const [drafts, setDrafts] = useState({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    dispatch(getSellerProducts())
  }, [dispatch])

  const metrics = useMemo(() => {
    return {
      count: sellerProducts.length,
      stock: sellerProducts.reduce((sum, product) => sum + (product.stock || 0), 0),
      value: sellerProducts.reduce((sum, product) => sum + (product.price?.amount || 0), 0),
    }
  }, [sellerProducts])

  function updateDraft(productId, field, value) {
    setDrafts((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        [field]: value,
      },
    }))
  }

  async function handleSave(productId) {
    const draft = drafts[productId]
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

      setMessage('Product updated successfully.')
    } catch (updateError) {
      setMessage(updateError || 'Unable to update product.')
    }
  }

  async function handleDelete(productId) {
    try {
      await dispatch(deleteProduct(productId)).unwrap()
      setMessage('Product deleted successfully.')
    } catch (deleteError) {
      setMessage(deleteError || 'Unable to delete product.')
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>Seller studio</span>
          <h1>Manage your live inventory</h1>
          <p>Edit title, pricing, description, and stock directly against the product service.</p>
        </div>
        <Link to="/seller/products/new" className={styles.primaryButton}>
          Add a new product
        </Link>
      </div>

      <div className={styles.metricRow}>
        <div className={styles.metricCard}>
          <strong>{metrics.count}</strong>
          <span>Active listings</span>
        </div>
        <div className={styles.metricCard}>
          <strong>{metrics.stock}</strong>
          <span>Total units in stock</span>
        </div>
        <div className={styles.metricCard}>
          <strong>{formatCurrency(metrics.value)}</strong>
          <span>Visible price value</span>
        </div>
      </div>

      {message ? <div className={styles.successBanner}>{message}</div> : null}
      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <div className={styles.sellerGrid}>
        {sellerProducts.map((product) => {
          const draft = drafts[product._id] || {
            title: product.title,
            description: product.description || '',
            priceAmount: product.price?.amount || 0,
            stock: product.stock || 0,
          }

          return (
            <article key={product._id} className={styles.sellerCard}>
              <img src={getProductImage(product)} alt={product.title} className={styles.sellerImage} />

              <div className={styles.sellerFields}>
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

                <div className={styles.sellerInlineFields}>
                  <label className={styles.fieldBlock}>
                    <span>Price</span>
                    <input
                      type="number"
                      value={draft.priceAmount || 0}
                      onChange={(event) => updateDraft(product._id, 'priceAmount', event.target.value)}
                    />
                  </label>

                  <label className={styles.fieldBlock}>
                    <span>Stock</span>
                    <input
                      type="number"
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

      {!isLoading && sellerProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No seller products yet</h2>
          <p>Create your first listing to start using the seller side of the marketplace.</p>
        </div>
      ) : null}
    </section>
  )
}
