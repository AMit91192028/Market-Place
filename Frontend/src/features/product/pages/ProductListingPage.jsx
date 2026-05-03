import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getProducts } from '../../../services/api/productApi'
import {
  formatCurrency,
  formatProductCategory,
  getProductDiscountPercent,
  getProductImage,
  getProductOriginalPrice,
  getProductRating,
} from '../../../utils/marketplace'
import styles from '../styles/CatalogPage.module.css'

const PAGE_SIZE = 18

const QUICK_FILTERS = [
  { label: 'All products', params: { q: '', minprice: '', maxprice: '', category: '', sort: 'featured' } },
  { label: 'Budget buys', params: { q: '', minprice: '', maxprice: '999', category: '', sort: 'price-low' } },
  { label: 'Premium edit', params: { q: '', minprice: '1500', maxprice: '', category: '', sort: 'price-high' } },
]

export default function ProductListingPage() {
  const dispatch = useDispatch()
  const { products, productMeta, isLoading, error } = useSelector((state) => state.product)
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const minprice = searchParams.get('minprice') || ''
  const maxprice = searchParams.get('maxprice') || ''
  const sort = searchParams.get('sort') || 'featured'
  const rawPage = Number(searchParams.get('page') || '1')
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1

  useEffect(() => {
    dispatch(
      getProducts({
        q: query || undefined,
        category: category || undefined,
        minprice: minprice || undefined,
        maxprice: maxprice || undefined,
        sort,
        skip: Math.max(page - 1, 0) * PAGE_SIZE,
        limit: PAGE_SIZE,
      })
    )
  }, [category, dispatch, maxprice, minprice, page, query, sort])

  const availableCategories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => formatProductCategory(product.category))
          .filter((value) => value && value !== 'Uncategorized')
      )
    )
  }, [products])

  const visibleProducts = products
  const totalPages = Math.max(1, Math.ceil((productMeta.total || 0) / PAGE_SIZE))

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
              <select value={sort} onChange={(event) => updateFilters({ sort: event.target.value })}>
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to high</option>
                <option value="price-high">Price: High to low</option>
                <option value="stock">Most stocked</option>
              </select>
            </label>
          </article>
        </aside>

        <div className={styles.resultsPane}>
          <div className={styles.activeFilterRow}>
            {category ? <span className={styles.filterPill}>{category}</span> : null}
            {minprice ? <span className={styles.filterPill}>Min {formatCurrency(minprice)}</span> : null}
            {maxprice ? <span className={styles.filterPill}>Max {formatCurrency(maxprice)}</span> : null}
            {query ? <span className={styles.filterPill}>Search: {query}</span> : null}
          </div>

          {isLoading ? (
            <div className={styles.productGrid}>
              {Array.from({ length: 5 }).map((_, index) => (
                <article key={index} className={styles.cardSkeleton} />
              ))}
            </div>
          ) : visibleProducts.length ? (
            <div className={styles.productGrid}>
              {visibleProducts.map((product) => (
                <Link key={product._id} to={`/products/${product._id}`} className={styles.productCard}>
                  <div className={styles.productMedia}>
                    <img src={getProductImage(product)} alt={product.title} />
                    <span className={styles.ratingBadge}>{getProductRating(product)}★</span>
                  </div>

                  <div className={styles.productBody}>
                    <h3>{product.title}</h3>
                    <div className={styles.priceRow}>
                      <strong>{formatCurrency(product.price?.amount, product.price?.currency || 'INR')}</strong>
                      {getProductDiscountPercent(product) > 0 ? (
                        <span className={styles.originalPrice}>
                          {formatCurrency(getProductOriginalPrice(product), product.price?.currency || 'INR')}
                        </span>
                      ) : null}
                    </div>
                    <p className={styles.offerText}>
                      {formatCurrency(Math.max(Math.round((Number(product.price?.amount) || 0) * 0.95), 0))} with Bank offer
                    </p>
                  </div>
                </Link>
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
          disabled={page <= 1}
          onClick={() => changePage(page - 1)}
        >
          Previous
        </button>
        <span>{`Page ${Math.min(page, totalPages)} of ${totalPages}`}</span>
        <button
          className={styles.secondaryButton}
          disabled={!productMeta.hasMore}
          onClick={() => changePage(page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  )
}
