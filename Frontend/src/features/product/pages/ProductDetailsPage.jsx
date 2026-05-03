import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addItemToCart } from '../../../services/api/cartApi'
import { getProductById } from '../../../services/api/productApi'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  getBadgeText,
  getDeliveryLabel,
  formatCurrency,
  formatProductCategory,
  getProductDiscountPercent,
  getProductDescription,
  getProductGalleryImages,
  getProductImage,
  getProductOriginalPrice,
  getProductRating,
} from '../../../utils/marketplace'
import styles from '../styles/Product.module.css'

export default function ProductDetailsPage() {
  const { productId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { currentProduct, isLoading, error } = useSelector((state) => state.product)
  const { isAuthenticated, role } = useAuth()
  const [message, setMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState('')

  useEffect(() => {
    dispatch(getProductById(productId))
  }, [dispatch, productId])

  const galleryImages = useMemo(() => getProductGalleryImages(currentProduct), [currentProduct])

  const descriptionText = getProductDescription(currentProduct?.description)

  const detailPoints = useMemo(() => {
    return descriptionText
      .split(/\r?\n|(?<=[.!?])\s+/)
      .map((line) => line.replace(/^\s*[-*]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 5)
  }, [descriptionText])

  const descriptionParagraphs = useMemo(() => {
    const paragraphs = descriptionText
      .split(/\r?\n+/)
      .map((line) => line.trim())
      .filter(Boolean)

    return paragraphs.length > 0
      ? paragraphs
      : ['A live product listing connected directly to the marketplace product service.']
  }, [descriptionText])

  async function handleAddToCart() {
    if (!isAuthenticated || role !== 'user') {
      navigate('/auth/login')
      return
    }

    try {
      await dispatch(addItemToCart({ productId, qty: 1 })).unwrap()
      setMessage('Item added to cart.')
    } catch (cartError) {
      setMessage(cartError || 'Unable to add item to cart.')
    }
  }

  async function handleBuyNow() {
    if (!isAuthenticated || role !== 'user') {
      navigate('/auth/login')
      return
    }

    try {
      await dispatch(addItemToCart({ productId, qty: 1 })).unwrap()
      navigate('/checkout')
    } catch (cartError) {
      setMessage(cartError || 'Unable to continue to checkout.')
    }
  }

  if (isLoading && !currentProduct) {
    return <div className={styles.emptyState}>Loading product details...</div>
  }

  if (error && !currentProduct) {
    return <div className={styles.errorBanner}>{error}</div>
  }

  if (!currentProduct) {
    return null
  }

  const currentPrice = Number(currentProduct.price?.amount) || 0
  const currency = currentProduct.price?.currency || 'INR'
  const originalPrice = getProductOriginalPrice(currentProduct)
  const discountPercent = getProductDiscountPercent(currentProduct)
  const selectedPreview = galleryImages.includes(selectedImage)
    ? selectedImage
    : galleryImages[0] || getProductImage(currentProduct)

  return (
    <section className={styles.detailPage}>
      <Link to="/products" className={styles.backLink}>
        Back to products
      </Link>

      {message ? <div className={styles.successBanner}>{message}</div> : null}

      <div className={styles.productShowcase}>
        <div className={styles.galleryPanel}>
          <div className={styles.previewWrap}>
            <img src={selectedPreview} alt={currentProduct.title} />
            <span className={styles.stockPill}>
              {currentProduct.stock > 0 ? `${currentProduct.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          <div className={styles.thumbnailRail}>
            {galleryImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className={`${styles.thumbnailButton} ${
                  selectedPreview === image ? styles.thumbnailButtonActive : ''
                }`}
                onClick={() => setSelectedImage(image)}
              >
                <img src={image} alt={`${currentProduct.title} view ${index + 1}`} />
              </button>
            ))}
          </div>

          <div className={styles.galleryActions}>
            <button
              className={styles.primaryButton}
              disabled={currentProduct.stock <= 0}
              onClick={handleAddToCart}
            >
              Add to cart
            </button>
            <button
              className={styles.buyNowButton}
              disabled={currentProduct.stock <= 0}
              onClick={handleBuyNow}
            >
              Buy now
            </button>
          </div>

          <div className={styles.mobileSelectionCard}>
            <div>
              <span>Selected quantity</span>
              <strong>1 unit</strong>
              <small>{formatCurrency(currentPrice, currency)} each</small>
            </div>
            <div className={styles.mobileSelectionPrice}>
              <span>Total</span>
              <strong>{formatCurrency(currentPrice, currency)}</strong>
            </div>
          </div>
        </div>

        <div className={styles.purchasePanel}>
          <div className={styles.productMeta}>
            <span className={styles.eyebrow}>Verified marketplace listing</span>
            <span className={styles.categoryTag}>{formatProductCategory(currentProduct.category)}</span>
          </div>

          <div className={styles.titleBlock}>
            <h1>{currentProduct.title}</h1>
            <div className={styles.marketSignals}>
              <span className={styles.ratingPill}>★ {getProductRating(currentProduct)} rating</span>
              <span className={styles.discountPill}>
                {discountPercent > 0 ? `${discountPercent}% off` : getBadgeText(currentProduct)}
              </span>
            </div>
          </div>

          <div className={styles.priceCluster}>
            <div className={styles.priceRowMain}>
              <strong>{formatCurrency(currentPrice, currency)}</strong>
              {discountPercent > 0 ? (
                <span className={styles.originalPriceInline}>{formatCurrency(originalPrice, currency)}</span>
              ) : null}
            </div>
            <span className={styles.offerText}>
              {discountPercent > 0
                ? `You save ${formatCurrency(originalPrice - currentPrice, currency)} on this offer`
                : 'Marketplace pricing with secure checkout'}
            </span>
          </div>

          <div className={styles.deliveryCard}>
            <div>
              <strong>{getDeliveryLabel(currentProduct)}</strong>
              <span>Delivery, checkout, and address sync stay connected across the marketplace flow.</span>
            </div>
            <span className={styles.deliveryBadge}>
              {currentProduct.stock > 0 ? 'Ready to ship' : 'Unavailable'}
            </span>
          </div>

          {detailPoints.length > 0 ? (
            <div className={styles.highlightPanel}>
              <h2>Highlights</h2>
              <ul className={styles.highlightList}>
                {detailPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className={styles.specGrid}>
            <div className={styles.specCard}>
              <strong>{currentProduct.stock || 0}</strong>
              <span>Units available</span>
            </div>
            <div className={styles.specCard}>
              <strong>{formatProductCategory(currentProduct.category)}</strong>
              <span>Category</span>
            </div>
            <div className={styles.specCard}>
              <strong>{currentProduct.price?.currency || 'INR'}</strong>
              <span>Currency</span>
            </div>
            <div className={styles.specCard}>
              <strong>{galleryImages.length}</strong>
              <span>Product images</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.detailInfoCard}>
        <div className={styles.infoTabs}>
          <span className={styles.infoTabActive}>Description</span>
          <span className={styles.infoTab}>Delivery</span>
          <span className={styles.infoTab}>Details</span>
        </div>

        <div className={styles.infoContent}>
          <div className={styles.infoSection}>
            <h2>Product description</h2>
            {descriptionParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className={styles.infoSection}>
            <h2>Why shoppers choose this</h2>
            <p>{getDeliveryLabel(currentProduct)}</p>
            <p>
              The detail page supports up to five backend images, direct add-to-cart actions, and a
              fast path into checkout for customer accounts.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.mobileStickyBar}>
        <button
          className={styles.mobileStickySecondary}
          disabled={currentProduct.stock <= 0}
          onClick={handleAddToCart}
        >
          Add to cart
        </button>
        <button className={styles.mobileStickyPrimary} disabled={currentProduct.stock <= 0} onClick={handleBuyNow}>
          Buy at {formatCurrency(currentPrice, currency)}
        </button>
      </div>
    </section>
  )
}
