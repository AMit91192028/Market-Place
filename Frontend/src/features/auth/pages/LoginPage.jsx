import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser } from '../../../services/api/authApi'
import styles from '../styles/Auth.module.css'

const LOGIN_POINTS = ['Secure cookie session', 'Customer and seller roles', 'Cart and order sync']

export default function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isLoading, error } = useSelector((state) => state.auth)
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  async function onSubmit(values) {
    const identifier = values.identifier.trim()
    const payload = {
      password: values.password,
      ...(identifier.includes('@') ? { email: identifier } : { username: identifier }),
    }

    try {
      const user = await dispatch(loginUser(payload)).unwrap()
      navigate(user?.role === 'seller' ? '/seller/products' : '/products')
    } catch {
      return null
    }
  }

  return (
    <section className={styles.authLayout}>
      <div className={styles.authPanel}>
        <span className={styles.eyebrow}>Welcome back</span>
        <h1>Sign in to continue trading, shopping, and shipping without friction.</h1>
        <p>
          Your marketplace session uses the live auth service, so once you sign in your cart, orders,
          and seller tools stay connected across the other microservices.
        </p>

        <div className={styles.featureList}>
          {LOGIN_POINTS.map((point) => (
            <div key={point} className={styles.featureCard}>
              <strong>{point}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <span className={styles.badge}>Marketplace Access</span>
          <h2>Sign in</h2>
          <p>Use your email or username, then step right back into the storefront.</p>
        </div>

        {error ? <div className={styles.errorBox}>{error}</div> : null}

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <label className={styles.field}>
            <span>Email or username</span>
            <input
              type="text"
              placeholder="seller@shop.com or sellername"
              {...register('identifier', { required: 'Email or username is required' })}
            />
            {errors.identifier ? <small>{errors.identifier.message}</small> : null}
          </label>

          <label className={styles.field}>
            <span>Password</span>
            <div className={styles.passwordRow}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
              />
              <button
                type="button"
                className={styles.inlineButton}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password ? <small>{errors.password.message}</small> : null}
          </label>

          <button type="submit" className={styles.primaryButton} disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Continue to marketplace'}
          </button>
        </form>

        <p className={styles.footerCopy}>
          New here? <Link to="/auth/register">Create an account</Link>
        </p>
      </div>
    </section>
  )
}
