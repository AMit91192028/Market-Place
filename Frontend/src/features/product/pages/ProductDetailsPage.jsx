import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addItemToCart } from '../../../services/api/cartApi'
import { getProductById } from '../../../services/api/productApi'
import { useAuth } from '../../auth/hooks/useAuth'
import { formatCurrency, getProductImage } from '../../../utils/marketplace'
import styles from '../styles/Product.module.css'

export default function ProductDetailsPage() {
  const { productId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { currentProduct, isLoading, error } = useSelector((state) => state.product)
  const { isAuthenticated, role } = useAuth()
  const [message, setMessage] = useState('')

  useEffect(() => {
    dispatch(getProductById(productId))
  }, [dispatch, productId])

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

  if (isLoading && !currentProduct) {
    return <div className={styles.emptyState}>Loading product details...</div>
  }

  if (error && !currentProduct) {
    return <div className={styles.errorBanner}>{error}</div>
  }

  if (!currentProduct) {
    return null
  }

  return (
    <section className={styles.detailPage}>
      <Link to="/products" className={styles.backLink}>
        Back to products
      </Link>

      {message ? <div className={styles.successBanner}>{message}</div> : null}

      <div className={styles.detailCard}>
        <div className={styles.detailMedia}>
          <img src={getProductImage(currentProduct)} alt={currentProduct.title} />
        </div>

        <div className={styles.detailContent}>
          <span className={styles.eyebrow}>Verified marketplace listing</span>
          <h1>{currentProduct.title}</h1>
          <p>{currentProduct.description || 'A live product listing connected to the product microservice.'}</p>

          <div className={styles.detailStats}>
            <div>
              <strong>{formatCurrency(currentProduct.price?.amount, currentProduct.price?.currency || 'INR')}</strong>
              <span>Current listed price</span>
            </div>
            <div>
              <strong>{currentProduct.stock || 0}</strong>
              <span>Units available</span>
            </div>
            <div>
              <strong>Seller-ready</strong>
              <span>Works with protected routes</span>
            </div>
          </div>

          <div className={styles.cardActions}>
            <button
              className={styles.primaryButton}
              disabled={currentProduct.stock <= 0}
              onClick={handleAddToCart}
            >
              Add to cart
            </button>
            <Link to="/cart" className={styles.secondaryButton}>
              Go to cart
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
