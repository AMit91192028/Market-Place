import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addItemToCart } from '../../../services/api/cartApi'
import { getProducts } from '../../../services/api/productApi'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  getDeliveryLabel,
  formatCurrency,
  formatProductCategory,
  getBadgeText,
  getCategoryMonogram,
  getProductDiscountPercent,
  getProductDescription,
  getProductImage,
  getProductOriginalPrice,
  getProductRating,
} from '../../../utils/marketplace'
import styles from '../styles/StorefrontHomePage.module.css'

const FALLBACK_COLLECTIONS = [
  'Electronics',
  'Fashion',
  'Accessories',
  'Footwear',
  'Home Decor',
  'Beauty Care',
  'Travel Gear',
  'Sports',
]

const PROMO_BANNERS = [
  {
    title: 'Sunglasses',
    caption: 'Sharp silhouettes, lighter prices',
    cta: 'Browse accessories',
    category: 'Accessories',
  },
  {
    title: 'Footwear',
    caption: 'Comfort-led styles with premium finishing',
    cta: 'Shop footwear',
    category: 'Footwear',
  },
  {
    title: 'Daily essentials',
    caption: 'Curated picks that move from desk to downtime',
    cta: 'See fresh arrivals',
    category: 'Fashion',
  },
]

const COLLECTION_TABS = [
  { id: 'new-arrivals', label: 'New Arrival' },
  { id: 'best-value', label: 'Best Value' },
  { id: 'top-rated', label: 'Top Rated' },
]

function getCategoryHref(category) {
  return `/products?category=${encodeURIComponent(category)}`
}

export default function StorefrontHomePage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, role } = useAuth()
  const { products, isLoading, error } = useSelector((state) => state.product)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('new-arrivals')
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)

  useEffect(() => {
    dispatch(getProducts({ limit: 20 }))
  }, [dispatch])

  const heroProduct = products[0] || null

  const categoryCollections = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        products
          .map((product) => formatProductCategory(product.category))
          .filter((category) => category && category !== 'Uncategorized')
      )
    )

    const collections = [...uniqueCategories, ...FALLBACK_COLLECTIONS]
      .filter((value, index, array) => array.indexOf(value) === index)
      .slice(0, 8)

    return collections
  }, [products])

  const dealProducts = useMemo(() => {
    return [...products]
      .sort((left, right) => {
        const stockDelta = Number(right.stock || 0) - Number(left.stock || 0)

        if (stockDelta !== 0) {
          return stockDelta
        }

        return Number(left.price?.amount || 0) - Number(right.price?.amount || 0)
      })
      .slice(0, 5)
  }, [products])

  const tabProducts = useMemo(() => {
    const nextProducts = [...products]

    switch (activeTab) {
      case 'best-value':
        return nextProducts
          .sort((left, right) => Number(left.price?.amount || 0) - Number(right.price?.amount || 0))
          .slice(0, 5)
      case 'top-rated':
        return nextProducts
          .sort((left, right) => Number(right.stock || 0) - Number(left.stock || 0))
          .slice(0, 5)
      default:
        return nextProducts.slice(0, 5)
    }
  }, [activeTab, products])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBannerIndex((current) => (current + 1) % PROMO_BANNERS.length)
    }, 4000)

    return () => window.clearInterval(timer)
  }, [])

  const activeBanner = PROMO_BANNERS[activeBannerIndex]

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

  return (
    <section className={styles.page}>
      <div className={styles.heroShell}>
        <aside className={styles.categoryRail}>
          <div className={styles.railTitle}>
            <span className={styles.kicker}>Shopping by collection</span>
            <h2>Browse by department</h2>
          </div>

          <div className={styles.railList}>
            {categoryCollections.map((category) => (
              <Link key={category} to={getCategoryHref(category)} className={styles.railItem}>
                <span className={styles.railBadge}>{getCategoryMonogram(category)}</span>
                <div>
                  <strong>{category}</strong>
                  <span>Curated picks and trending deals</span>
                </div>
              </Link>
            ))}
          </div>
        </aside>

        <div className={styles.heroStage}>
          <div className={styles.heroCopy}>
            <span className={styles.heroEyebrow}>Summer sale spotlight</span>
            <h1>Collections that feel editorial, shoppable, and ready for real buyers.</h1>
            <p>
              A modern marketplace landing experience with strong category discovery, clean product
              storytelling, and fast paths into your live product service.
            </p>

            <div className={styles.heroActions}>
              <Link to="/products" className={styles.primaryButton}>
                Shop now
              </Link>
              <Link to="/products?maxprice=1499" className={styles.secondaryButton}>
                Explore deals
              </Link>
            </div>

            <div className={styles.heroFacts}>
              <div>
                <strong>{products.length}</strong>
                <span>Live listings in focus</span>
              </div>
              <div>
                <strong>Secure</strong>
                <span>Cart, checkout, and orders connected</span>
              </div>
              <div>
                <strong>Curated</strong>
                <span>Collection-first browsing experience</span>
              </div>
            </div>
          </div>

          <div className={styles.heroFeature}>
            <div className={styles.heroFeatureMedia}>
              {heroProduct ? (
                <img src={getProductImage(heroProduct)} alt={heroProduct.title} />
              ) : (
                <div className={styles.heroPlaceholder}>MarketPlace</div>
              )}
            </div>

            <div className={styles.heroFeatureCard}>
              <span className={styles.inlinePill}>Featured item</span>
              <h3>{heroProduct?.title || 'Fresh arrivals for every aisle'}</h3>
              <p>
                {heroProduct
                  ? getProductDescription(heroProduct.description) ||
                    'Explore a polished product presentation backed by your live microservices.'
                  : 'Browse a storefront experience inspired by premium retail themes and adapted for your marketplace.'}
              </p>
              <div className={styles.heroPriceRow}>
                <strong>
                  {heroProduct
                    ? formatCurrency(heroProduct.price?.amount, heroProduct.price?.currency || 'INR')
                    : formatCurrency(1499)}
                </strong>
                <span>{heroProduct ? formatProductCategory(heroProduct.category) : 'Seasonal highlight'}</span>
              </div>
              <Link
                to={heroProduct ? `/products/${heroProduct._id}` : '/products'}
                className={styles.textLink}
              >
                View spotlight product
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.collectionRow}>
        {categoryCollections.map((category) => (
          <Link key={category} to={getCategoryHref(category)} className={styles.collectionBubble}>
            <span>{getCategoryMonogram(category)}</span>
            <strong>{category}</strong>
          </Link>
        ))}
      </div>

      {message ? <div className={styles.successBanner}>{message}</div> : null}
      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.kicker}>Deals of the day</span>
            <h2>High-visibility products with strong stock and sharper pricing.</h2>
          </div>
          <Link to="/products" className={styles.textLink}>
            View full catalog
          </Link>
        </div>

        {isLoading ? (
          <div className={styles.dealGrid}>
            {Array.from({ length: 5 }).map((_, index) => (
              <article key={index} className={styles.skeletonCard} />
            ))}
          </div>
        ) : (
          <div className={styles.dealGrid}>
            {dealProducts.map((product) => (
              <article key={product._id} className={styles.productCard}>
                <div className={styles.productMedia}>
                  <img src={getProductImage(product)} alt={product.title} />
                  <span className={styles.productBadge}>{getBadgeText(product)}</span>
                </div>

                <div className={styles.productBody}>
                  <span className={styles.inlinePill}>{formatProductCategory(product.category)}</span>
                  <h3>{product.title}</h3>
                  <p>
                    {getProductDescription(product.description) ||
                      'A polished marketplace pick ready for fast checkout.'}
                  </p>
                  <div className={styles.priceLine}>
                    <strong>{formatCurrency(product.price?.amount, product.price?.currency || 'INR')}</strong>
                    <span>
                      {getProductDiscountPercent(product) > 0
                        ? `${getProductDiscountPercent(product)}% off`
                        : 'Marketplace value'}
                    </span>
                  </div>
                  <div className={styles.marketMeta}>
                    <span className={styles.ratingPill}>⭐ {getProductRating(product)}</span>
                    {getProductDiscountPercent(product) > 0 ? (
                      <span className={styles.originalPrice}>
                        {formatCurrency(getProductOriginalPrice(product), product.price?.currency || 'INR')}
                      </span>
                    ) : null}
                  </div>
                  <p className={styles.deliveryText}>{getDeliveryLabel(product)}</p>
                  <div className={styles.cardActions}>
                    <Link to={`/products/${product._id}`} className={styles.ghostButton}>
                      Details
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
        )}
      </section>

      <section className={styles.carouselSection}>
        <Link to={getCategoryHref(activeBanner.category)} className={styles.promoCard}>
          <span className={styles.kicker}>{activeBanner.title}</span>
          <h3>{activeBanner.caption}</h3>
          <span className={styles.textLink}>{activeBanner.cta}</span>
        </Link>
        <div className={styles.carouselDots}>
          {PROMO_BANNERS.map((banner, index) => (
            <button
              key={banner.title}
              type="button"
              className={`${styles.dotButton} ${activeBannerIndex === index ? styles.dotButtonActive : ''}`}
              onClick={() => setActiveBannerIndex(index)}
              aria-label={`Show banner ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.kicker}>Fashion products</span>
            <h2>Editorial cards for new arrivals, value buys, and top movers.</h2>
          </div>

          <div className={styles.tabRow}>
            {COLLECTION_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className={styles.catalogRow}>
            {Array.from({ length: 5 }).map((_, index) => (
              <article key={index} className={styles.skeletonCard} />
            ))}
          </div>
        ) : (
          <div className={styles.catalogRow}>
            {tabProducts.map((product) => (
              <article key={product._id} className={styles.productCard}>
                <div className={styles.productMedia}>
                  <img src={getProductImage(product)} alt={product.title} />
                </div>

                <div className={styles.productBody}>
                  <span className={styles.inlinePill}>{formatProductCategory(product.category)}</span>
                  <h3>{product.title}</h3>
                  <div className={styles.priceLine}>
                    <strong>{formatCurrency(product.price?.amount, product.price?.currency || 'INR')}</strong>
                    <span>{getProductDiscountPercent(product) > 0 ? `${getProductDiscountPercent(product)}% off` : getBadgeText(product)}</span>
                  </div>
                  <div className={styles.marketMeta}>
                    <span className={styles.ratingPill}>⭐ {getProductRating(product)}</span>
                    {getProductDiscountPercent(product) > 0 ? (
                      <span className={styles.originalPrice}>
                        {formatCurrency(getProductOriginalPrice(product), product.price?.currency || 'INR')}
                      </span>
                    ) : null}
                  </div>
                  <p className={styles.deliveryText}>{getDeliveryLabel(product)}</p>
                  <Link to={`/products/${product._id}`} className={styles.textLink}>
                    Open product page
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
