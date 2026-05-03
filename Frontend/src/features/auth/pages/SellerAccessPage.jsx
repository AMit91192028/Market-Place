import { Link } from 'react-router-dom'
import styles from '../styles/Auth.module.css'

export default function SellerAccessPage() {
  return (
    <section className={styles.authLayout}>
      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <span className={styles.eyebrow}>Seller marketplace</span>
          <div className={styles.brandMark}>MP</div>
          <div className={styles.brandTitle}>Market Place</div>
          <p className={styles.brandSubline}>Build your storefront, publish products, and manage orders.</p>
        </div>
      </div>

      <div className={styles.formCard}>
        <div className={styles.formCardInner}>
          <div className={styles.formHeader}>
            <span className={styles.badge}>Become a seller</span>
            <h2>Seller access</h2>
            <p>Start selling on Market Place by creating your seller account.</p>
          </div>

          <div className={styles.sellerEntryActions}>
            <Link to="/seller/auth/register" className={styles.primaryButton}>
              Create seller account
            </Link>
          </div>

          <p className={styles.footerCopy}>
            Already have an account? <Link to="/auth/login">Login</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
