import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

const FOOTER_GROUPS = [
  {
    title: 'About',
    links: ['Contact Us', 'About Us', 'Careers', 'Press'],
  },
  {
    title: 'Group Companies',
    links: ['MarketPlace Plus', 'Travel Desk', 'Seller Studio', 'Gift Cards'],
  },
  {
    title: 'Help',
    links: ['Payments', 'Shipping', 'Cancellation and Returns', 'FAQ'],
  },
  {
    title: 'Consumer Policy',
    links: ['Terms of Use', 'Privacy', 'Security', 'Sitemap'],
  },
]

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brandColumn}>
          <div className={styles.brand}>
            <span className={styles.brandMark}>MP</span>
            <strong>Market Place</strong>
          </div>
          <p>Shop faster with curated collections, trusted delivery, and secure checkout.</p>
          <div className={styles.socialRow}>
            <span>FB</span>
            <span>IG</span>
            <span>YT</span>
            <span>X</span>
          </div>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <div key={group.title} className={styles.linkColumn}>
            <h3>{group.title}</h3>
            {group.links.map((link) => (
              <Link key={link} to="/" className={styles.link}>
                {link}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.bottom}>
        <span>&copy; {new Date().getFullYear()} Market Place. All rights reserved.</span>
        <div className={styles.bottomLinks}>
          <Link to="/">Become a Seller</Link>
          <Link to="/">Advertise</Link>
          <Link to="/">Help Center</Link>
        </div>
      </div>
    </footer>
  )
}
