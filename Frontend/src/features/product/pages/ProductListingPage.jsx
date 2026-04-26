import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addItemToCart } from '../../../services/api/cartApi'
import { getProducts } from '../../../services/api/productApi'
import { useAuth } from '../../auth/hooks/useAuth'
import { formatCurrency, getBadgeText, getProductImage } from '../../../utils/marketplace'
import styles from '../styles/Product.module.css'

const CATEGORY_CHIPS = [
  { label: 'All', params: {} },
  { label: 'Phone picks', params: { q: 'phone' } },
  { label: 'Fashion drops', params: { q: 'fashion' } },
  { label: 'Home upgrade', params: { q: 'home' } },
  { label: 'Under 999', params: { maxprice: '999' } },
]

export default function ProductListingPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, role } = useAuth()
  const { products, isLoading, error } = useSelector((state) => state.product)
  const [searchParams, setSearchParams] = useSearchParams()
  const [sort, setSort] = useState('featured')
  const [message, setMessage] = useState('')

  const query = searchParams.get('q') || ''
  const minprice = searchParams.get('minprice') || ''
  const maxprice = searchParams.get('maxprice') || ''
  const page = Number(searchParams.get('page') || '1')

  useEffect(() => {
    dispatch(
      getProducts({
        q: query || undefined,
        minprice: minprice || undefined,
        maxprice: maxprice || undefined,
        skip: (page - 1) * 12,
        limit: 12,
      })
    )
  }, [dispatch, maxprice, minprice, page, query])

  const visibleProducts = useMemo(() => {
    const nextProducts = [...products]

    switch (sort) {
      case 'price-low':
        return nextProducts.sort((a, b) => (a.price?.amount || 0) - (b.price?.amount || 0))
      case 'price-high':
        return nextProducts.sort((a, b) => (b.price?.amount || 0) - (a.price?.amount || 0))
      case 'stock':
        return nextProducts.sort((a, b) => (b.stock || 0) - (a.stock || 0))
      default:
        return nextProducts
    }
  }, [products, sort])

  async function handleAddToCart(productId) {
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

  function updateFilters(nextValues) {
    const params = new URLSearchParams(searchParams)
    Object.entries(nextValues).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    params.set('page', '1')
    setSearchParams(params)
  }

  function changePage(nextPage) {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(nextPage))
    setSearchParams(params)
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Live microservice storefront</span>
          <h1>Big-basket energy with curated deals, fast filters, and seller-ready lanes.</h1>
          <p>
            Browse the product service catalog, add items into the cart service, then push straight
            into checkout and order creation without leaving the experience.
          </p>

          <div className={styles.heroActions}>
            <Link to="/products" className={styles.primaryButton}>
              Shop the feed
            </Link>
            <button
              className={styles.secondaryButton}
              onClick={() => updateFilters({ maxprice: '1499', q: '' })}
            >
              Budget winners
            </button>
          </div>

          <div className={styles.metricRow}>
            <div className={styles.metricCard}>
              <strong>{products.length}</strong>
              <span>Products in this view</span>
            </div>
            <div className={styles.metricCard}>
              <strong>RBAC</strong>
              <span>Customer and seller flows</span>
            </div>
            <div className={styles.metricCard}>
              <strong>Live APIs</strong>
              <span>Auth, cart, order, product</span>
            </div>
          </div>
        </div>

        <div className={styles.heroBoard}>
          <div className={styles.heroCardAccent}>Festival price cuts</div>
          <div className={styles.heroCardMain}>
            <h3>Marketplace pulse</h3>
            <p>Search by keyword, narrow by price, then sort the feed just like a modern commerce app.</p>
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.chipRow}>
          {CATEGORY_CHIPS.map((chip) => (
            <button
              key={chip.label}
              className={styles.chip}
              onClick={() => updateFilters({ q: chip.params.q || '', maxprice: chip.params.maxprice || '' })}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className={styles.filterPanel}>
          <label>
            <span>Min price</span>
            <input
              type="number"
              value={minprice}
              onChange={(event) => updateFilters({ minprice: event.target.value })}
            />
          </label>
          <label>
            <span>Max price</span>
            <input
              type="number"
              value={maxprice}
              onChange={(event) => updateFilters({ maxprice: event.target.value })}
            />
          </label>
          <label>
            <span>Sort</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to high</option>
              <option value="price-high">Price: High to low</option>
              <option value="stock">Most stocked</option>
            </select>
          </label>
        </div>
      </div>

      {message ? <div className={styles.successBanner}>{message}</div> : null}
      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <article key={index} className={styles.cardSkeleton} />
          ))}
        </div>
      ) : visibleProducts.length ? (
        <div className={styles.grid}>
          {visibleProducts.map((product) => (
            <article key={product._id} className={styles.productCard}>
              <div className={styles.productMedia}>
                <img src={getProductImage(product)} alt={product.title} />
                <span className={styles.productBadge}>{getBadgeText(product)}</span>
              </div>

              <div className={styles.productBody}>
                <div className={styles.productHeader}>
                  <div>
                    <h3>{product.title}</h3>
                    <p>{product.description || 'A marketplace essential with live service-backed pricing.'}</p>
                  </div>
                  <span className={styles.stockPill}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>

                <div className={styles.priceRow}>
                  <strong>{formatCurrency(product.price?.amount, product.price?.currency || 'INR')}</strong>
                  <span>Assured seller lane</span>
                </div>

                <div className={styles.cardActions}>
                  <Link to={`/products/${product._id}`} className={styles.secondaryButton}>
                    View details
                  </Link>
                  <button
                    className={styles.primaryButton}
                    disabled={product.stock <= 0}
                    onClick={() => handleAddToCart(product._id)}
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2>No products found</h2>
          <p>Try a broader search or clear the price filters to bring more products into view.</p>
        </div>
      )}

      <div className={styles.pagination}>
        <button className={styles.secondaryButton} disabled={page <= 1} onClick={() => changePage(page - 1)}>
          Previous
        </button>
        <span>Page {page}</span>
        <button
          className={styles.secondaryButton}
          disabled={products.length < 12}
          onClick={() => changePage(page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  )
}
