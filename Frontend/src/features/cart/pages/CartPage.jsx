import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { clearCart, getCart, removeCartItem, updateCartItem } from '../../../services/api/cartApi'
import { formatCurrency, getProductImage } from '../../../utils/marketplace'
import styles from '../styles/Cart.module.css'

export default function CartPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const { items, subtotal, shipping, tax, total, isLoading, error } = useSelector((state) => state.cart)

  useEffect(() => {
    dispatch(getCart())
  }, [dispatch])

  async function changeQuantity(productId, quantity) {
    try {
      if (quantity <= 0) {
        await dispatch(removeCartItem(productId)).unwrap()
        setMessage('Item removed from cart.')
        return
      }

      await dispatch(updateCartItem({ productId, qty: quantity })).unwrap()
      setMessage('Cart updated.')
    } catch (cartError) {
      setMessage(cartError || 'Unable to update cart.')
    }
  }

  async function handleClearCart() {
    try {
      await dispatch(clearCart()).unwrap()
      setMessage('Cart cleared.')
    } catch (cartError) {
      setMessage(cartError || 'Unable to clear cart.')
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Cart service</span>
          <h1>Your shopping basket</h1>
          <p>Every quantity update here is writing back to the cart microservice.</p>
        </div>
        <button className={styles.ghostButton} onClick={() => navigate('/products')}>
          Continue shopping
        </button>
      </div>

      {message ? <div className={styles.successBanner}>{message}</div> : null}
      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      {!isLoading && items.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>Your cart is empty</h2>
          <p>Pick something from the marketplace feed and it will appear here instantly.</p>
          <Link to="/products" className={styles.primaryButton}>
            Explore products
          </Link>
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.itemStack}>
            {items.map((item) => (
              <article key={item.productId} className={styles.itemCard}>
                <img src={getProductImage(item)} alt={item.title} className={styles.itemImage} />

                <div className={styles.itemBody}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className={styles.itemMeta}>{item.stock > 0 ? `${item.stock} left in stock` : 'Out of stock'}</span>
                </div>

                <div className={styles.itemActions}>
                  <strong>{formatCurrency(item.currentPrice?.amount, item.currentPrice?.currency || 'INR')}</strong>
                  <div className={styles.qtyControl}>
                    <button onClick={() => changeQuantity(item.productId, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => changeQuantity(item.productId, item.quantity + 1)}>+</button>
                  </div>
                  <button className={styles.linkButton} onClick={() => changeQuantity(item.productId, 0)}>
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className={styles.summaryCard}>
            <span className={styles.eyebrow}>Price details</span>
            <h2>Order summary</h2>

            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <strong>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Estimated tax</span>
              <strong>{formatCurrency(tax)}</strong>
            </div>
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Total</span>
              <strong>{formatCurrency(total)}</strong>
            </div>

            <button className={styles.primaryButton} onClick={() => navigate('/checkout')}>
              Proceed to checkout
            </button>
            <button className={styles.ghostButton} onClick={handleClearCart}>
              Clear cart
            </button>
          </aside>
        </div>
      )}
    </section>
  )
}
