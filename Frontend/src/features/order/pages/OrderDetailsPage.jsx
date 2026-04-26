import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { cancelOrder, getOrderById, updateOrderAddress } from '../../../services/api/orderApi'
import { formatAddress, formatCurrency } from '../../../utils/marketplace'
import styles from '../styles/Order.module.css'

export default function OrderDetailsPage() {
  const { orderId } = useParams()
  const dispatch = useDispatch()
  const { currentOrder, error } = useSelector((state) => state.order)
  const [editAddress, setEditAddress] = useState(false)
  const [draftAddress, setDraftAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  })

  useEffect(() => {
    dispatch(getOrderById(orderId))
  }, [dispatch, orderId])

  if (!currentOrder) {
    return <div className={styles.emptyState}>Loading order details...</div>
  }

  function openAddressEditor() {
    setDraftAddress({
      street: currentOrder.shippingAddress?.street || '',
      city: currentOrder.shippingAddress?.city || '',
      state: currentOrder.shippingAddress?.state || '',
      pincode: currentOrder.shippingAddress?.zip || '',
      country: currentOrder.shippingAddress?.country || 'India',
    })
    setEditAddress(true)
  }

  async function handleSaveAddress() {
    await dispatch(updateOrderAddress({ orderId, address: draftAddress })).unwrap()
    setEditAddress(false)
  }

  return (
    <section className={styles.page}>
      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <div className={styles.detailPanel}>
        <div className={styles.orderCardHeader}>
          <div>
            <span className={styles.eyebrow}>Order details</span>
            <h1>Order #{currentOrder._id.slice(-8)}</h1>
          </div>
          <span className={styles.statusBadge}>{currentOrder.status}</span>
        </div>

        <div className={styles.summaryRow}>
          <span>Total amount</span>
          <strong>{formatCurrency(currentOrder.totalPrice?.amount, currentOrder.totalPrice?.currency || 'INR')}</strong>
        </div>

        <div className={styles.addressBlock}>
          <div className={styles.panelHeader}>
            <h2>Shipping address</h2>
            {currentOrder.status === 'PENDING' ? (
              <button
                className={styles.ghostButton}
                onClick={() => (editAddress ? setEditAddress(false) : openAddressEditor())}
              >
                {editAddress ? 'Close' : 'Edit address'}
              </button>
            ) : null}
          </div>

          <p>{formatAddress(currentOrder.shippingAddress)}</p>

          {editAddress ? (
            <div className={styles.addressForm}>
              <input
                type="text"
                value={draftAddress.street}
                onChange={(event) => setDraftAddress({ ...draftAddress, street: event.target.value })}
              />
              <div className={styles.inlineFields}>
                <input
                  type="text"
                  value={draftAddress.city}
                  onChange={(event) => setDraftAddress({ ...draftAddress, city: event.target.value })}
                />
                <input
                  type="text"
                  value={draftAddress.state}
                  onChange={(event) => setDraftAddress({ ...draftAddress, state: event.target.value })}
                />
              </div>
              <div className={styles.inlineFields}>
                <input
                  type="text"
                  value={draftAddress.pincode}
                  onChange={(event) => setDraftAddress({ ...draftAddress, pincode: event.target.value })}
                />
                <input
                  type="text"
                  value={draftAddress.country}
                  onChange={(event) => setDraftAddress({ ...draftAddress, country: event.target.value })}
                />
              </div>
              <button className={styles.primaryButton} onClick={handleSaveAddress}>
                Save address
              </button>
            </div>
          ) : null}
        </div>

        <div className={styles.orderItems}>
          {currentOrder.items.map((item) => (
            <div key={`${item.product}-${item.quantity}`} className={styles.lineItem}>
              <span>Product {String(item.product).slice(-6)}</span>
              <span>
                {item.quantity} x {formatCurrency(item.price?.amount, item.price?.currency || 'INR')}
              </span>
            </div>
          ))}
        </div>

        {currentOrder.status === 'PENDING' ? (
          <button className={styles.dangerButton} onClick={() => dispatch(cancelOrder(orderId))}>
            Cancel this order
          </button>
        ) : null}
      </div>
    </section>
  )
}
