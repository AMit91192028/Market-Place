import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addItemToCart } from '../../../services/api/cartApi'
import { getProducts } from '../../../services/api/productApi'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  getDeliveryLabel,
  formatCurrency,
  formatProductCategory,
  getBadgeText,
  getProductDiscountPercent,
  getProductDescription,
  getProductImage,
  getProductOriginalPrice,
  getProductRating,
} from '../../../utils/marketplace'
import styles from '../styles/CatalogPage.module.css'

const QUICK_FILTERS = [
  { label: 'All products', params: { q: '', minprice: '', maxprice: '', category: '' } },
  { label: 'Budget buys', params: { q: '', minprice: '', maxprice: '999', category: '' } },
  { label: 'Premium edit', params: { q: '', minprice: '1500', maxprice: '', category: '' } },
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
  const category = searchParams.get('category') || ''
  const minprice = searchParams.get('minprice') || ''
  const maxprice = searchParams.get('maxprice') || ''
  const page = Number(searchParams.get('page') || '1')
  const hasCategoryFilter = Boolean(category)
  const requestLimit = hasCategoryFilter ? 24 : 18

  useEffect(() => {
    dispatch(
      getProducts({
        q: query || undefined,
        minprice: minprice || undefined,
        maxprice: maxprice || undefined,
        skip: hasCategoryFilter ? 0 : (page - 1) * 18,
        limit: requestLimit,
      })
    )
  }, [dispatch, hasCategoryFilter, maxprice, minprice, page, query, requestLimit])

  const availableCategories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => formatProductCategory(product.category))
          .filter((value) => value && value !== 'Uncategorized')
      )
    )
  }, [products])

  const visibleProducts = useMemo(() => {
    let nextProducts = [...products]

    if (category) {
      nextProducts = nextProducts.filter(
        (product) => formatProductCategory(product.category).toLowerCase() === category.toLowerCase()
      )
    }

    switch (sort) {
      case 'price-low':
        return nextProducts.sort((left, right) => (left.price?.amount || 0) - (right.price?.amount || 0))
      case 'price-high':
        return nextProducts.sort((left, right) => (right.price?.amount || 0) - (left.price?.amount || 0))
      case 'stock':
        return nextProducts.sort((left, right) => (right.stock || 0) - (left.stock || 0))
      default:
        return nextProducts
    }
  }, [category, products, sort])

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
      <div className={styles.catalogIntro}>
        <div>
          <span className={styles.eyebrow}>Curated catalog</span>
          <h1>Explore products with cleaner listing cards, stronger filters, and faster shopping flow.</h1>
          <p>
            The catalog now behaves more like a real marketplace shelf: filters stay visible, products
            arrive earlier on screen, and price, discount, rating, and delivery details are easier to scan.
          </p>
        </div>

        <div className={styles.quickRow}>
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter.label}
              type="button"
              className={styles.quickChip}
              onClick={() => updateFilters(filter.params)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {message ? <div className={styles.successBanner}>{message}</div> : null}
      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <div className={styles.catalogLayout}>
        <aside className={styles.sidebar}>
          <article className={styles.filterCard}>
            <div className={styles.filterHeader}>
              <span className={styles.eyebrow}>Filters</span>
              <h2>Categories</h2>
            </div>

            <button
              type="button"
              className={`${styles.categoryButton} ${!category ? styles.categoryButtonActive : ''}`}
              onClick={() => updateFilters({ category: '' })}
            >
              All categories
            </button>

            {availableCategories.map((item) => (
              <button
                key={item}
                type="button"
                className={`${styles.categoryButton} ${category === item ? styles.categoryButtonActive : ''}`}
                onClick={() => updateFilters({ category: item })}
              >
                {item}
              </button>
            ))}
          </article>

          <article className={styles.filterCard}>
            <div className={styles.filterHeader}>
              <span className={styles.eyebrow}>Refine</span>
              <h2>Price and sort</h2>
            </div>

            <label className={styles.field}>
              <span>Min price</span>
              <input
                type="number"
                value={minprice}
                onChange={(event) => updateFilters({ minprice: event.target.value })}
              />
            </label>

            <label className={styles.field}>
              <span>Max price</span>
              <input
                type="number"
                value={maxprice}
                onChange={(event) => updateFilters({ maxprice: event.target.value })}
              />
            </label>

            <label className={styles.field}>
              <span>Sort by</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to high</option>
                <option value="price-high">Price: High to low</option>
                <option value="stock">Most stocked</option>
              </select>
            </label>
          </article>
        </aside>

        <div className={styles.resultsPane}>
          <div className={styles.resultsHeader}>
            <div>
              <span className={styles.eyebrow}>Catalog results</span>
              <h2>
                {category
                  ? `${visibleProducts.length} result${visibleProducts.length === 1 ? '' : 's'} in ${category}`
                  : `${visibleProducts.length} products ready to browse`}
              </h2>
              <p>
                {query
                  ? `Search applied for "${query}". Adjust filters to widen the selection.`
                  : 'Browse a denser marketplace-style layout with product-first hierarchy.'}
              </p>
            </div>
            <Link to="/" className={styles.textLink}>
              Back to homepage
            </Link>
          </div>

          <div className={styles.activeFilterRow}>
            {category ? <span className={styles.filterPill}>{category}</span> : null}
            {minprice ? <span className={styles.filterPill}>Min {formatCurrency(minprice)}</span> : null}
            {maxprice ? <span className={styles.filterPill}>Max {formatCurrency(maxprice)}</span> : null}
            {query ? <span className={styles.filterPill}>Search: {query}</span> : null}
          </div>

          {isLoading ? (
            <div className={styles.listStack}>
              {Array.from({ length: 5 }).map((_, index) => (
                <article key={index} className={styles.cardSkeleton} />
              ))}
            </div>
          ) : visibleProducts.length ? (
            <div className={styles.listStack}>
              {visibleProducts.map((product) => (
                <article key={product._id} className={styles.productCard}>
                  <div className={styles.productMedia}>
                    <img src={getProductImage(product)} alt={product.title} />
                    <span className={styles.productBadge}>{getBadgeText(product)}</span>
                  </div>

                  <div className={styles.productSummary}>
                    <span className={styles.categoryTag}>{formatProductCategory(product.category)}</span>
                    <h3>{product.title}</h3>
                    <p>
                      {getProductDescription(product.description) ||
                        'A marketplace essential with live pricing and service-backed checkout.'}
                    </p>
                    <div className={styles.summaryMeta}>
                      <span className={styles.ratingPill}>Rating {getProductRating(product)}</span>
                      <span>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span>
                      <span>{getDeliveryLabel(product)}</span>
                    </div>
                  </div>

                  <div className={styles.buyPanel}>
                    <strong>{formatCurrency(product.price?.amount, product.price?.currency || 'INR')}</strong>
                    {getProductDiscountPercent(product) > 0 ? (
                      <>
                        <span className={styles.originalPrice}>
                          {formatCurrency(getProductOriginalPrice(product), product.price?.currency || 'INR')}
                        </span>
                        <span className={styles.discountText}>
                          {getProductDiscountPercent(product)}% off
                        </span>
                      </>
                    ) : (
                      <span className={styles.discountText}>{getBadgeText(product)}</span>
                    )}
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
              <p>Try clearing one or two filters to bring more products into this collection.</p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.pagination}>
        <button
          className={styles.secondaryButton}
          disabled={page <= 1 || hasCategoryFilter}
          onClick={() => changePage(page - 1)}
        >
          Previous
        </button>
        <span>{hasCategoryFilter ? 'Category view' : `Page ${page}`}</span>
        <button
          className={styles.secondaryButton}
          disabled={products.length < requestLimit || hasCategoryFilter}
          onClick={() => changePage(page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  )
}
