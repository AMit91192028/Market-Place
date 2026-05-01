import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { addUserAddress, getUserAddresses, logoutUser } from '../../services/api/authApi'
import { getCart } from '../../services/api/cartApi'
import { formatAddress, getAddressSummary, getWelcomeName } from '../../utils/marketplace'
import styles from './Navbar.module.css'

const COLLECTION_LINKS = [
  'Electronics',
  'Fashion',
  'Home',
  'Appliances',
  'Beauty',
  'Sports',
  'Books',
  'Travel',
]

const EMPTY_ADDRESS = { street: '', city: '', state: '', pincode: '', country: 'India' }
const LOCATION_STORAGE_KEY = 'marketplace:selectedAddressId'

function buildCategoryHref(category) {
  return `/products?category=${encodeURIComponent(category)}`
}

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isAuthenticated, role, user } = useAuth()
  const { addresses, isLoading: authLoading } = useSelector((state) => state.auth)
  const { itemCount } = useSelector((state) => state.cart)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS)
  const [selectedAddressId, setSelectedAddressId] = useState(() => {
    if (typeof window === 'undefined') {
      return ''
    }

    return window.localStorage.getItem(LOCATION_STORAGE_KEY) || ''
  })
  const searchInputRef = useRef(null)
  const searchTerm = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('q') || ''
  }, [location.search])
  const selectedAddress = useMemo(
    () => addresses.find((address) => address._id === selectedAddressId) || addresses[0] || null,
    [addresses, selectedAddressId]
  )

  useEffect(() => {
    if (isAuthenticated && role === 'user') {
      dispatch(getCart())
    }
  }, [dispatch, isAuthenticated, role])

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getUserAddresses())
    }
  }, [dispatch, isAuthenticated])

  useEffect(() => {
    if (!selectedAddressId && addresses[0]?._id) {
      setSelectedAddressId(addresses[0]._id)
    }
  }, [addresses, selectedAddressId])

  useEffect(() => {
    if (typeof window !== 'undefined' && selectedAddress?._id) {
      window.localStorage.setItem(LOCATION_STORAGE_KEY, selectedAddress._id)
    }
  }, [selectedAddress])

  async function handleLogout() {
    await dispatch(logoutUser())
    navigate('/products')
    setMenuOpen(false)
    setAccountOpen(false)
    setLocationOpen(false)
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

  function handleLocationToggle() {
    if (!isAuthenticated) {
      navigate('/auth/login')
      return
    }

    setAccountOpen(false)
    setLocationMessage('')
    setLocationOpen((value) => !value)
  }

  function handleSelectAddress(addressId) {
    setSelectedAddressId(addressId)
    setLocationMessage('Delivery location updated.')
    setLocationOpen(false)
  }

  async function handleSaveAddress() {
    try {
      const savedAddress = await dispatch(addUserAddress(addressForm)).unwrap()
      setAddressForm(EMPTY_ADDRESS)
      setSelectedAddressId(savedAddress._id)
      setLocationMessage('Address saved and selected for delivery.')
      setLocationOpen(false)
    } catch (addressError) {
      setLocationMessage(addressError || 'Unable to save address.')
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.utilityBar}>
        <div className={styles.utilityInner}>
          <div className={styles.utilityList}>
            <span>Super savings days</span>
            <span>Secure checkout and trusted sellers</span>
          </div>
          <div className={styles.locationWrap}>
            <span className={styles.locationSummary}>{getAddressSummary(selectedAddress)}</span>
            <button type="button" className={styles.locationButton} onClick={handleLocationToggle}>
              {selectedAddress ? 'Change delivery location' : 'Select delivery location'}
            </button>

            {locationOpen ? (
              <div className={styles.locationPanel}>
                <div className={styles.locationPanelHeader}>
                  <div>
                    <strong>Delivery location</strong>
                    <span>Choose a saved address or add a new one</span>
                  </div>
                  <button type="button" className={styles.panelClose} onClick={() => setLocationOpen(false)}>
                    Close
                  </button>
                </div>

                {locationMessage ? <div className={styles.locationStatus}>{locationMessage}</div> : null}

                <div className={styles.addressList}>
                  {addresses.map((address) => (
                    <button
                      key={address._id}
                      type="button"
                      className={`${styles.addressCard} ${
                        selectedAddress?._id === address._id ? styles.addressCardActive : ''
                      }`}
                      onClick={() => handleSelectAddress(address._id)}
                    >
                      {formatAddress(address)}
                    </button>
                  ))}

                  {addresses.length === 0 ? (
                    <div className={styles.emptyAddress}>Add your first address to enable delivery selection.</div>
                  ) : null}
                </div>

                <div className={styles.locationForm}>
                  <input
                    type="text"
                    placeholder="Street"
                    value={addressForm.street}
                    onChange={(event) => setAddressForm({ ...addressForm, street: event.target.value })}
                  />
                  <div className={styles.formRow}>
                    <input
                      type="text"
                      placeholder="City"
                      value={addressForm.city}
                      onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={addressForm.state}
                      onChange={(event) => setAddressForm({ ...addressForm, state: event.target.value })}
                    />
                  </div>
                  <div className={styles.formRow}>
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={addressForm.pincode}
                      onChange={(event) => setAddressForm({ ...addressForm, pincode: event.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Country"
                      value={addressForm.country}
                      onChange={(event) => setAddressForm({ ...addressForm, country: event.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.saveLocationButton}
                    disabled={authLoading}
                    onClick={handleSaveAddress}
                  >
                    {authLoading ? 'Saving...' : 'Save address'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.searchBarWrap}>
        <div className={styles.searchBarInner}>
          <Link to="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
            <span className={styles.logoMark}>MP</span>
            <div>
              <strong>Market Place</strong>
              <span>Explore Plus</span>
            </div>
          </Link>

          <form className={styles.searchBar} onSubmit={handleSearchSubmit}>
            <input
              key={location.search}
              ref={searchInputRef}
              type="search"
              placeholder="Search for products, brands and more"
              defaultValue={searchTerm}
            />
            <button type="submit">Search</button>
          </form>

          <div className={styles.actionRow}>
            <div className={styles.accountWrap}>
              <button
                type="button"
                className={styles.accountButton}
                onClick={() => {
                  setLocationOpen(false)
                  setAccountOpen((value) => !value)
                }}
              >
                {isAuthenticated ? getWelcomeName(user) : 'Login'}
              </button>

              {accountOpen ? (
                <div className={styles.accountMenu}>
                  {isAuthenticated ? (
                    <>
                      <span className={styles.accountTitle}>
                        {role === 'seller' ? 'Seller account' : 'Customer account'}
                      </span>
                      {role === 'user' ? (
                        <Link to="/orders" className={styles.accountLink} onClick={() => setAccountOpen(false)}>
                          My orders
                        </Link>
                      ) : (
                        <Link
                          to="/seller/products"
                          className={styles.accountLink}
                          onClick={() => setAccountOpen(false)}
                        >
                          Seller studio
                        </Link>
                      )}
                      <button type="button" className={styles.accountLogout} onClick={handleLogout}>
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={styles.accountTitle}>New customer?</span>
                      <Link
                        to="/auth/register"
                        className={styles.accountLinkStrong}
                        onClick={() => setAccountOpen(false)}
                      >
                        Sign up
                      </Link>
                      <Link to="/auth/login" className={styles.accountLink} onClick={() => setAccountOpen(false)}>
                        Login
                      </Link>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            {role === 'user' ? (
              <Link to="/cart" className={styles.actionLink} onClick={() => setAccountOpen(false)}>
                Cart {itemCount > 0 ? <span className={styles.badge}>{itemCount}</span> : null}
              </Link>
            ) : null}

            {role === 'seller' ? (
              <Link to="/seller/products/new" className={styles.actionLink} onClick={() => setAccountOpen(false)}>
                Add product
              </Link>
            ) : null}

            <button type="button" className={styles.menuToggle} onClick={() => setMenuOpen((value) => !value)}>
              Menu
            </button>
          </div>
        </div>
      </div>

      <div className={styles.categoryBar}>
        <div className={styles.categoryInner}>
          <NavLink to="/" className={styles.homeLink}>
            Home
          </NavLink>
          <NavLink to="/products" className={styles.homeLink}>
            Products
          </NavLink>
          {COLLECTION_LINKS.map((category) => (
            <Link
              key={category}
              to={buildCategoryHref(category)}
              className={styles.categoryLink}
              onClick={() => setMenuOpen(false)}
            >
              <strong>{category}</strong>
            </Link>
          ))}
        </div>
      </div>

      <div className={`${styles.mobileMenu} ${menuOpen ? styles.open : ''}`}>
        <div className={styles.mobileMenuInner}>
          <NavLink to="/" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/products" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
            Products
          </NavLink>
          {COLLECTION_LINKS.map((category) => (
            <Link
              key={category}
              to={buildCategoryHref(category)}
              className={styles.mobileLink}
              onClick={() => setMenuOpen(false)}
            >
              {category}
            </Link>
          ))}
          {isAuthenticated && role === 'seller' ? (
            <NavLink to="/seller/products" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              Seller studio
            </NavLink>
          ) : null}
          {isAuthenticated && role === 'user' ? (
            <NavLink to="/orders" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              My orders
            </NavLink>
          ) : null}
          {!isAuthenticated ? (
            <div className={styles.mobileAuthRow}>
              <Link to="/auth/login" className={styles.mobileSecondary} onClick={() => setMenuOpen(false)}>
                Login
              </Link>
              <Link to="/auth/register" className={styles.mobilePrimary} onClick={() => setMenuOpen(false)}>
                Sign up
              </Link>
            </div>
          ) : null}
          {isAuthenticated ? (
            <button type="button" className={styles.mobileLogout} onClick={handleLogout}>
              Logout
            </button>
          ) : null}
          <button type="button" className={styles.mobileClose} onClick={() => setMenuOpen(false)}>
            Close menu
          </button>
        </div>
      </div>
    </header>
  )
}
