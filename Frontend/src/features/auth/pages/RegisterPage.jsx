import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { registerUser } from '../../../services/api/authApi'
import styles from '../styles/Auth.module.css'

const ROLE_TILES = [
  { title: 'Customer mode', copy: 'Build carts, save addresses, and manage orders.' },
  { title: 'Seller mode', copy: 'Publish products and manage your inventory lane.' },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isLoading, error } = useSelector((state) => state.auth)
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: 'user',
    },
  })

  async function onSubmit(values) {
    try {
      const user = await dispatch(
        registerUser({
          username: values.username,
          email: values.email,
          password: values.password,
          fullName: {
            firstName: values.firstName,
            lastName: values.lastName,
          },
          role: values.role,
        })
      ).unwrap()

      navigate(user?.role === 'seller' ? '/seller/products/new' : '/products')
    } catch {
      return null
    }
  }

  return (
    <section className={styles.authLayout}>
      <div className={styles.authPanel}>
        <span className={styles.eyebrow}>Join the marketplace</span>
        <h1>Create one account and choose whether you shop or sell.</h1>
        <p>
          The auth service already supports role-based access, so this registration screen lets you
          start as a buyer or jump straight into seller mode.
        </p>

        <div className={styles.featureList}>
          {ROLE_TILES.map((tile) => (
            <div key={tile.title} className={styles.featureCard}>
              <strong>{tile.title}</strong>
              <span>{tile.copy}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <span className={styles.badge}>Role-based access</span>
          <h2>Create account</h2>
          <p>Pick your role now. You can start shopping or launch your product shelf right away.</p>
        </div>

        {error ? <div className={styles.errorBox}>{error}</div> : null}

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.gridTwo}>
            <label className={styles.field}>
              <span>First name</span>
              <input type="text" {...register('firstName', { required: 'First name is required' })} />
              {errors.firstName ? <small>{errors.firstName.message}</small> : null}
            </label>

            <label className={styles.field}>
              <span>Last name</span>
              <input type="text" {...register('lastName', { required: 'Last name is required' })} />
              {errors.lastName ? <small>{errors.lastName.message}</small> : null}
            </label>
          </div>

          <label className={styles.field}>
            <span>Username</span>
            <input
              type="text"
              placeholder="marketmaster"
              {...register('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'Username must be at least 3 characters' },
              })}
            />
            {errors.username ? <small>{errors.username.message}</small> : null}
          </label>

          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email ? <small>{errors.email.message}</small> : null}
          </label>

          <div className={styles.gridTwo}>
            <label className={styles.field}>
              <span>Password</span>
              <input
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
              />
              {errors.password ? <small>{errors.password.message}</small> : null}
            </label>

            <label className={styles.field}>
              <span>Confirm password</span>
              <input
                type="password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === getValues('password') || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword ? <small>{errors.confirmPassword.message}</small> : null}
            </label>
          </div>

          <label className={styles.field}>
            <span>Choose your role</span>
            <select {...register('role', { required: 'Role is required' })}>
              <option value="user">Customer</option>
              <option value="seller">Seller</option>
            </select>
          </label>

          <button type="submit" className={styles.primaryButton} disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create marketplace account'}
          </button>
        </form>

        <p className={styles.footerCopy}>
          Already have an account? <Link to="/auth/login">Sign in</Link>
        </p>
      </div>
    </section>
  )
}
