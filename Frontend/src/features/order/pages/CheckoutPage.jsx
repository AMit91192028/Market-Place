import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addUserAddress, getUserAddresses } from '../../../services/api/authApi'
import { clearCart, getCart } from '../../../services/api/cartApi'
import { createOrder } from '../../../services/api/orderApi'
import { formatAddress, formatCurrency, getProductImage, toOrderAddress } from '../../../utils/marketplace'
import styles from '../styles/Order.module.css'

const EMPTY_ADDRESS = { street: '', city: '', state: '', pincode: '', country: 'India' }

export default function CheckoutPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items, subtotal, shipping, tax, total } = useSelector((state) => state.cart)
  const { addresses, isLoading: authLoading } = useSelector((state) => state.auth)
  const { isLoading: orderLoading, error } = useSelector((state) => state.order)
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS)
  const [message, setMessage] = useState('')

  useEffect(() => {
    dispatch(getCart())
    dispatch(getUserAddresses())
  }, [dispatch])

  const selectedAddress = useMemo(
    () => addresses.find((address) => address._id === (selectedAddressId || addresses[0]?._id)),
    [addresses, selectedAddressId]
  )

  async function handleSaveAddress() {
    try {
      const savedAddress = await dispatch(addUserAddress(addressForm)).unwrap()
      setSelectedAddressId(savedAddress._id)
      setAddressForm(EMPTY_ADDRESS)
      setShowForm(false)
      setMessage('Address saved.')
    } catch (addressError) {
      setMessage(addressError || 'Unable to save address.')
    }
  }

  async function handlePlaceOrder() {
    if (!selectedAddress) {
      setMessage('Select a delivery address before placing the order.')
      return
    }

    try {
      const order = await dispatch(
        createOrder({
          shippingAddress: toOrderAddress(selectedAddress),
        })
      ).unwrap()

      await dispatch(clearCart()).unwrap()
      navigate(`/orders/${order._id}`)
    } catch (orderError) {
      setMessage(orderError || 'Unable to place order.')
    }
  }

  if (items.length === 0) {
    return (
      <section className={styles.page}>
        <div className={styles.emptyState}>
          <h2>Your cart needs items before checkout</h2>
          <p>Browse the storefront, then return here once your basket is ready.</p>
          <Link to="/products" className={styles.primaryButton}>
            Back to products
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>Order service</span>
          <h1>Checkout</h1>
          <p>Choose an address, confirm your basket, and create a live order from your cart.</p>
        </div>
      </div>

      {message ? <div className={styles.errorBanner}>{message}</div> : null}
      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <div className={styles.checkoutLayout}>
        <div className={styles.addressColumn}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Delivery addresses</h2>
              <button className={styles.ghostButton} onClick={() => setShowForm((value) => !value)}>
                {showForm ? 'Close form' : 'Add address'}
              </button>
            </div>

            <div className={styles.addressList}>
              {addresses.map((address) => (
                <button
                  key={address._id}
                  className={`${styles.addressCard} ${
                    selectedAddressId === address._id ? styles.addressCardActive : ''
                  }`}
                  onClick={() => setSelectedAddressId(address._id)}
                >
                  {formatAddress(address)}
                </button>
              ))}
            </div>

            {showForm ? (
              <div className={styles.addressForm}>
                <input
                  type="text"
                  placeholder="Street"
                  value={addressForm.street}
                  onChange={(event) => setAddressForm({ ...addressForm, street: event.target.value })}
                />
                <div className={styles.inlineFields}>
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
                <div className={styles.inlineFields}>
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
                <button className={styles.primaryButton} disabled={authLoading} onClick={handleSaveAddress}>
                  Save address
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <aside className={styles.summaryPanel}>
          <h2>Order review</h2>

          <div className={styles.orderItems}>
            {items.map((item) => (
              <div key={item.productId} className={styles.orderItem}>
                <img src={getProductImage(item)} alt={item.title} />
                <div>
                  <strong>{item.title}</strong>
                  <span>
                    {item.quantity} x {formatCurrency(item.currentPrice?.amount, item.currentPrice?.currency || 'INR')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Shipping</span>
            <strong>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Tax</span>
            <strong>{formatCurrency(tax)}</strong>
          </div>
          <div className={`${styles.summaryRow} ${styles.totalRow}`}>
            <span>Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>

          <button className={styles.primaryButton} disabled={orderLoading} onClick={handlePlaceOrder}>
            {orderLoading ? 'Creating order...' : 'Place order'}
          </button>
        </aside>
      </div>
    </section>
  )
}
