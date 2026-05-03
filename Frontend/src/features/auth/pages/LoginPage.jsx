import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { loginUser } from '../../../services/api/authApi'
import styles from '../styles/Auth.module.css'

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
      toast.success(`Welcome back${user?.username ? `, ${user.username}` : ''}.`)
      navigate(user?.role === 'seller' ? '/seller/products' : '/products')
    } catch (submitError) {
      toast.error(submitError || 'Unable to sign in.')
      return null
    }
  }

  return (
    <section className={styles.authLayout}>
      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <span className={styles.eyebrow}>Marketplace login</span>
          <div className={styles.brandMark}>MP</div>
          <div className={styles.brandTitle}>Market Place</div>
          <p className={styles.brandSubline}>Shop smart. Sell smoothly.</p>
        </div>
      </div>

      <div className={styles.formCard}>
        <div className={styles.formCardInner}>
          <div className={styles.formHeader}>
            <span className={styles.badge}>Welcome back</span>
            <h2>Login</h2>
            <p>Enter your details to access products, checkout, and seller tools.</p>
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
              {isLoading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <p className={styles.footerCopy}>
            New here? <Link to="/auth/register">Create an account</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
