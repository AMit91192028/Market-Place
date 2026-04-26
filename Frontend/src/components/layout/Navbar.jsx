import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { getCart } from '../../services/api/cartApi'
import { logoutUser } from '../../services/api/authApi'
import { getWelcomeName } from '../../utils/marketplace'
import styles from './Navbar.module.css'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isAuthenticated, role, user } = useAuth()
  const { itemCount } = useSelector((state) => state.cart)
  const [menuOpen, setMenuOpen] = useState(false)
  const searchInputRef = useRef(null)
  const searchTerm = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('q') || ''
  }, [location.search])

  useEffect(() => {
    if (isAuthenticated && role === 'user') {
      dispatch(getCart())
    }
  }, [dispatch, isAuthenticated, role])

  async function handleLogout() {
    await dispatch(logoutUser())
    navigate('/products')
    setMenuOpen(false)
  }

  function handleSearchSubmit(event) {
    event.preventDefault()
    const params = new URLSearchParams()
    const query = searchInputRef.current?.value?.trim() || ''

    if (query) {
      params.set('q', query)
    }

    navigate(`/products${params.toString() ? `?${params.toString()}` : ''}`)
    setMenuOpen(false)
  }

  return (
    <header className={styles.header}>
      <div className={styles.topStrip}>
        <p>Flash deals, secure checkout, seller storefronts, and role-based access in one marketplace.</p>
      </div>

      <nav className={styles.navbar}>
        <div className={styles.container}>
          <Link to="/products" className={styles.logo} onClick={() => setMenuOpen(false)}>
            <span className={styles.logoMark}>MP</span>
            <div>
              <strong>MarketPlace</strong>
              <span>Trade smart, ship faster</span>
            </div>
          </Link>

          <form className={styles.searchBar} onSubmit={handleSearchSubmit}>
            <input
              key={location.search}
              ref={searchInputRef}
              type="search"
              placeholder="Search phones, fashion, home upgrades and more"
              defaultValue={searchTerm}
            />
            <button type="submit">Search</button>
          </form>

          <button className={styles.menuToggle} onClick={() => setMenuOpen((value) => !value)}>
            Menu
          </button>

          <div className={`${styles.menu} ${menuOpen ? styles.open : ''}`}>
            <div className={styles.navLinks}>
              <NavLink to="/products" className={styles.navLink} onClick={() => setMenuOpen(false)}>
                Discover
              </NavLink>

              {isAuthenticated && role === 'user' ? (
                <>
                  <NavLink to="/orders" className={styles.navLink} onClick={() => setMenuOpen(false)}>
                    Orders
                  </NavLink>
                  <NavLink to="/cart" className={styles.navLink} onClick={() => setMenuOpen(false)}>
                    Cart
                    {itemCount > 0 ? <span className={styles.badge}>{itemCount}</span> : null}
                  </NavLink>
                </>
              ) : null}

              {isAuthenticated && role === 'seller' ? (
                <>
                  <NavLink to="/seller/products" className={styles.navLink} onClick={() => setMenuOpen(false)}>
                    Seller Studio
                  </NavLink>
                  <NavLink
                    to="/seller/products/new"
                    className={styles.navLink}
                    onClick={() => setMenuOpen(false)}
                  >
                    Add Product
                  </NavLink>
                </>
              ) : null}
            </div>

            {isAuthenticated ? (
              <div className={styles.sessionBox}>
                <div className={styles.userMeta}>
                  <span className={styles.userLabel}>Signed in as</span>
                  <strong>{getWelcomeName(user)}</strong>
                  <span>{role === 'seller' ? 'Seller account' : 'Customer account'}</span>
                </div>
                <button className={styles.secondaryButton} onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <div className={styles.authButtons}>
                <Link to="/auth/login" className={styles.secondaryButton} onClick={() => setMenuOpen(false)}>
                  Sign in
                </Link>
                <Link to="/auth/register" className={styles.primaryButton} onClick={() => setMenuOpen(false)}>
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
