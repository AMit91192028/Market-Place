import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { getSellerProducts, updateProduct } from '../../../services/api/productApi'
import {
  normalizeProductDescriptionInput,
  toProductDescriptionTextarea,
} from '../../../utils/marketplace'
import SellerDashboardCreateProductPanel from '../components/SellerDashboardCreateProductPanel'
import styles from '../styles/SellerDashboard.module.css'

function buildInitialValues(product) {
  return {
    title: product?.title || '',
    category: product?.category || '',
    description: toProductDescriptionTextarea(product?.description),
    priceAmount: Number(product?.price?.amount || 0),
    priceCurrency: product?.price?.currency || 'INR',
    stock: Number(product?.stock || 0),
    images: null,
  }
}

export default function SellerEditProductPage() {
  const { productId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const { sellerProducts, isLoading } = useSelector((state) => state.product)

  useEffect(() => {
    if (!sellerProducts.length) {
      dispatch(getSellerProducts())
    }
  }, [dispatch, sellerProducts.length])

  const product = useMemo(
    () => sellerProducts.find((item) => item._id === productId) || null,
    [productId, sellerProducts]
  )

  async function handleUpdateSubmit(values) {
    if (!productId) {
      return
    }

    setIsSaving(true)
    setMessage('')
    setError('')

    try {
      const updatedProduct = await dispatch(
        updateProduct({
          productId,
          data: {
            title: String(values.title || '').trim(),
            category: String(values.category || '').trim(),
            description: normalizeProductDescriptionInput(values.description),
            stock: Number(values.stock || 0),
            price: {
              amount: Number(values.priceAmount || 0),
              currency: String(values.priceCurrency || product?.price?.currency || 'INR'),
            },
          },
        })
      ).unwrap()

      toast.success(`${updatedProduct?.title || 'Product'} updated successfully.`)
      navigate('/seller/products')
    } catch (updateError) {
      toast.error(updateError || 'Unable to update product.')
      setError(updateError || 'Unable to update product.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading && !product) {
    return <div className={styles.emptyState}>Loading product editor...</div>
  }

  if (!isLoading && !product) {
    return (
      <section className={styles.page}>
        <article className={styles.panel}>
          <div className={styles.emptyState}>
            <h3>Product not found</h3>
            <p>This seller product could not be loaded for editing.</p>
            <button type="button" className={styles.secondaryButton} onClick={() => navigate('/seller/products')}>
              Back to seller studio
            </button>
          </div>
        </article>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Seller Product Form</span>
          <h1>Update one product at a time with a cleaner edit flow.</h1>
          <p>
            Make changes on a dedicated page instead of editing inside the dashboard grid. This keeps the
            inventory view faster and easier to scan on mobile.
          </p>

          <div className={styles.heroActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => navigate('/seller/products')}>
              Back to seller studio
            </button>
            <Link to={`/products/${productId}`} className={styles.secondaryButton}>
              View product page
            </Link>
          </div>
        </div>

        <div className={styles.heroPanel}>
          <div className={styles.panelHeaderCompact}>
            <span className={styles.panelEyebrow}>Editing</span>
            <span className={styles.liveChip}>{product?.title || 'Selected listing'}</span>
          </div>

          <div className={styles.heroRevenue}>
            <strong>{product?.price?.currency || 'INR'} {Number(product?.price?.amount || 0)}</strong>
            <span>Current product-service price before saving updates.</span>
          </div>

          <div className={styles.heroGrid}>
            <div className={styles.heroTile}>
              <strong>{product?.stock || 0}</strong>
              <span>Units in stock</span>
            </div>
            <div className={styles.heroTile}>
              <strong>{product?.category || 'General'}</strong>
              <span>Category</span>
            </div>
            <div className={styles.heroTile}>
              <strong>1</strong>
              <span>Selected listing</span>
            </div>
            <div className={styles.heroTile}>
              <strong>Live</strong>
              <span>Product service source</span>
            </div>
          </div>
        </div>
      </section>

      {message ? <div className={styles.successBanner}>{message}</div> : null}
      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <SellerDashboardCreateProductPanel
        styles={styles}
        onSubmit={handleUpdateSubmit}
        isPublishing={isSaving}
        onCancel={() => navigate('/seller/products')}
        initialValues={buildInitialValues(product)}
        submitLabel="Save changes"
        eyebrow="Edit Listing"
        heading="Update product in product service"
        metaText="Changes are sent through the seller-only product update endpoint."
        showImages={false}
      />
    </section>
  )
}
