import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { createProduct } from '../../../services/api/productApi'
import { normalizeProductDescriptionInput } from '../../../utils/marketplace'
import SellerDashboardCreateProductPanel from '../components/SellerDashboardCreateProductPanel'
import styles from '../styles/SellerDashboard.module.css'

export default function SellerCreateProductPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)

  async function handleCreateSubmit(values) {
    setIsPublishing(true)
    setMessage('')
    setError('')

    const formData = new FormData()
    formData.append('title', String(values.title || '').trim())
    formData.append('category', String(values.category || '').trim())
    formData.append('description', normalizeProductDescriptionInput(values.description))
    formData.append('priceAmount', String(values.priceAmount ?? ''))
    formData.append('priceCurrency', String(values.priceCurrency || 'INR'))
    formData.append('stock', String(values.stock ?? 0))

    Array.from(values.images || []).forEach((file) => {
      formData.append('images', file)
    })

    try {
      const createdProduct = await dispatch(createProduct(formData)).unwrap()
      const createdTitle = createdProduct?.title || 'Product'
      toast.success(`${createdTitle} created successfully.`)
      setMessage(`${createdTitle} created successfully. You can close this tab or return to seller studio.`)
    } catch (createError) {
      toast.error(createError || 'Unable to create product.')
      setError(createError || 'Unable to create product.')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <section className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Seller Product Form</span>
          <h1>Create product in a dedicated tab.</h1>
          <p>
            This page sends product data directly to the product service. Use it for a cleaner upload flow,
            especially when adding images.
          </p>

          <div className={styles.heroActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => navigate('/seller/products')}>
              Back to seller studio
            </button>
            <Link to="/products" className={styles.secondaryButton}>
              View storefront
            </Link>
          </div>
        </div>

        <div className={styles.heroPanel}>
          <div className={styles.panelHeaderCompact}>
            <span className={styles.panelEyebrow}>Upload Tips</span>
            <span className={styles.liveChip}>Separate tab flow</span>
          </div>

          <div className={styles.heroRevenue}>
            <strong>Image-ready</strong>
            <span>Preview files before sending them to the product service.</span>
          </div>

          <div className={styles.heroGrid}>
            <div className={styles.heroTile}>
              <strong>1</strong>
              <span>Select images</span>
            </div>
            <div className={styles.heroTile}>
              <strong>2</strong>
              <span>Submit form</span>
            </div>
            <div className={styles.heroTile}>
              <strong>3</strong>
              <span>Return to dashboard</span>
            </div>
            <div className={styles.heroTile}>
              <strong>4</strong>
              <span>Verify product render</span>
            </div>
          </div>
        </div>
      </section>

      {message ? <div className={styles.successBanner}>{message}</div> : null}
      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <SellerDashboardCreateProductPanel
        styles={styles}
        onSubmit={handleCreateSubmit}
        isPublishing={isPublishing}
        onCancel={() => navigate('/seller/products')}
      />
    </section>
  )
}
