import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addUserAddress, getUserAddresses } from '../../../services/api/authApi'
import { clearCart, getCart } from '../../../services/api/cartApi'
import { createOrder } from '../../../services/api/orderApi'
import { createPaymentIntent, verifyPayment } from '../../../services/api/paymentApi'
import { resetPaymentState } from '../../../store/slices/paymentSlice'
import {
  formatAddress,
  formatCurrency,
  formatStatusLabel,
  getProductImage,
  toOrderAddress,
} from '../../../utils/marketplace'
import {
  loadRazorpayCheckoutScript,
  openRazorpayCheckout,
  savePaymentSnapshot,
} from '../../../utils/paymentSession'
import styles from '../styles/Order.module.css'

const EMPTY_ADDRESS = { street: '', city: '', state: '', pincode: '', country: 'India' }

export default function CheckoutPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items, subtotal, shipping, tax, total } = useSelector((state) => state.cart)
  const { user, addresses, isLoading: authLoading } = useSelector((state) => state.auth)
  const { isLoading: orderLoading, error } = useSelector((state) => state.order)
  const { currentPayment, isCreating, isVerifying, error: paymentError } = useSelector(
    (state) => state.payment
  )
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS)
  const [message, setMessage] = useState('')
  const [checkoutOrder, setCheckoutOrder] = useState(null)

  useEffect(() => {
    dispatch(resetPaymentState())
    dispatch(getCart())
    dispatch(getUserAddresses())
  }, [dispatch])

  const activeAddressId = selectedAddressId || addresses[0]?._id || ''
  const selectedAddress = useMemo(
    () => addresses.find((address) => address._id === activeAddressId),
    [activeAddressId, addresses]
  )
  const paymentForCurrentOrder =
    checkoutOrder && String(currentPayment?.order) === String(checkoutOrder._id) ? currentPayment : null
  const paymentGatewayReady = Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID)
  const isBusy = orderLoading || isCreating || isVerifying

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

  async function handleContinueToPayment() {
    if (!selectedAddress) {
      setMessage('Select a delivery address before placing the order.')
      return
    }

    try {
      setMessage('')
      let order = checkoutOrder

      if (!order) {
        order = await dispatch(
          createOrder({
            shippingAddress: toOrderAddress(selectedAddress),
          })
        ).unwrap()
        setCheckoutOrder(order)
      }

      if (!paymentForCurrentOrder) {
        const payment = await dispatch(createPaymentIntent(order._id)).unwrap()
        savePaymentSnapshot(order._id, payment)
      }

      setMessage('Order created. Your secure payment step is ready below.')
    } catch (orderError) {
      setMessage(orderError || 'Unable to prepare checkout.')
    }
  }

  async function handleOpenPayment() {
    if (!checkoutOrder || !paymentForCurrentOrder) {
      await handleContinueToPayment()
      return
    }

    if (!paymentGatewayReady) {
      setMessage('Add VITE_RAZORPAY_KEY_ID to the frontend environment to enable Razorpay checkout.')
      return
    }

    const scriptLoaded = await loadRazorpayCheckoutScript()

    if (!scriptLoaded) {
      setMessage('Unable to load Razorpay Checkout right now. Please retry in a moment.')
      return
    }

    try {
      const gatewayResponse = await openRazorpayCheckout({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order: checkoutOrder,
        payment: paymentForCurrentOrder,
        user,
      })

      const verifiedPayment = await dispatch(
        verifyPayment({
          razorpayOrderId: gatewayResponse.razorpay_order_id,
          paymentId: gatewayResponse.razorpay_payment_id,
          signature: gatewayResponse.razorpay_signature,
        })
      ).unwrap()

      savePaymentSnapshot(checkoutOrder._id, verifiedPayment)
      await dispatch(clearCart()).unwrap()
      navigate(`/orders/${checkoutOrder._id}`)
    } catch (paymentActionError) {
      setMessage(paymentActionError?.message || paymentActionError || 'Unable to complete payment.')
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
          <span className={styles.eyebrow}>Order and payment flow</span>
          <h1>Checkout</h1>
          <p>Choose a delivery address, create the order, and finish payment in one guided flow.</p>
        </div>
      </div>

      {message ? <div className={styles.errorBanner}>{message}</div> : null}
      {error ? <div className={styles.errorBanner}>{error}</div> : null}
      {paymentError ? <div className={styles.errorBanner}>{paymentError}</div> : null}

      <div className={styles.stageRow}>
        <div className={`${styles.stageCard} ${styles.stageActive}`}>
          <strong>1</strong>
          <span>Delivery address</span>
        </div>
        <div className={`${styles.stageCard} ${checkoutOrder ? styles.stageActive : ''}`}>
          <strong>2</strong>
          <span>Create order</span>
        </div>
        <div className={`${styles.stageCard} ${paymentForCurrentOrder ? styles.stageActive : ''}`}>
          <strong>3</strong>
          <span>Secure payment</span>
        </div>
      </div>

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
                    activeAddressId === address._id ? styles.addressCardActive : ''
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

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Payment readiness</h2>
                <p className={styles.subtleText}>
                  Orders are created first, then a Razorpay payment order is prepared for checkout.
                </p>
              </div>
            </div>

            {checkoutOrder ? (
              <div className={styles.paymentPanel}>
                <div className={styles.statusRow}>
                  <span className={styles.statusBadge}>{formatStatusLabel(checkoutOrder.status)}</span>
                  <span className={styles.codePill}>Order #{checkoutOrder._id.slice(-8)}</span>
                </div>
                <div className={styles.paymentInfoGrid}>
                  <div>
                    <span>Order total</span>
                    <strong>
                      {formatCurrency(
                        checkoutOrder.totalPrice?.amount,
                        checkoutOrder.totalPrice?.currency || 'INR'
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>Payment state</span>
                    <strong>{formatStatusLabel(paymentForCurrentOrder?.status || 'pending')}</strong>
                  </div>
                  <div>
                    <span>Gateway order</span>
                    <strong>{paymentForCurrentOrder?.razorpayOrderId || 'Preparing'}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.checkoutNote}>
                <strong>No order created yet</strong>
                <p>Start from the order review panel when your address and basket look correct.</p>
              </div>
            )}
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

          <div className={styles.paymentActionStack}>
            <button className={styles.primaryButton} disabled={isBusy} onClick={handleContinueToPayment}>
              {orderLoading
                ? 'Creating order...'
                : isCreating
                  ? 'Preparing payment...'
                  : checkoutOrder
                    ? 'Refresh payment setup'
                    : 'Create order and payment'}
            </button>

            <button
              className={styles.secondaryButton}
              disabled={!paymentForCurrentOrder || isVerifying}
              onClick={handleOpenPayment}
            >
              {isVerifying ? 'Verifying payment...' : 'Pay securely with Razorpay'}
            </button>
          </div>

          {!paymentGatewayReady ? (
            <p className={styles.helperText}>
              Razorpay checkout opens when <code>VITE_RAZORPAY_KEY_ID</code> is configured in the
              frontend.
            </p>
          ) : null}
        </aside>
      </div>
    </section>
  )
}
