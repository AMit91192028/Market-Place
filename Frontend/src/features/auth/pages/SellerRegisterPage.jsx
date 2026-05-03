import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { registerUser } from '../../../services/api/authApi'
import styles from '../styles/Auth.module.css'

export default function SellerRegisterPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isLoading, error } = useSelector((state) => state.auth)
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm()

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
          role: 'seller',
        })
      ).unwrap()

      toast.success(`Seller account created${user?.username ? ` for ${user.username}` : ''}.`)
      navigate('/seller/products/new')
    } catch (submitError) {
      toast.error(submitError || 'Unable to create seller account.')
      return null
    }
  }

  return (
    <section className={styles.authLayout}>
      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <span className={styles.eyebrow}>Seller signup</span>
          <div className={styles.brandMark}>MP</div>
          <div className={styles.brandTitle}>Market Place</div>
          <p className={styles.brandSubline}>Create your seller account and start listing products.</p>
        </div>
      </div>

      <div className={styles.formCard}>
        <div className={`${styles.formCardInner} ${styles.formCardInnerWide}`}>
          <div className={styles.formHeader}>
            <span className={styles.badge}>Seller account</span>
            <h2>Seller sign up</h2>
            <p>Create your seller credentials and launch your marketplace storefront.</p>
          </div>

          {error ? <div className={styles.errorBox}>{error}</div> : null}

          <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.gridTwo}>
              <label className={styles.field}>
                <span>First name</span>
                <input type="text" placeholder="Aman" {...register('firstName', { required: 'First name is required' })} />
                {errors.firstName ? <small>{errors.firstName.message}</small> : null}
              </label>

              <label className={styles.field}>
                <span>Last name</span>
                <input type="text" placeholder="Sharma" {...register('lastName', { required: 'Last name is required' })} />
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
                  placeholder="Create a password"
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
                  placeholder="Repeat your password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === getValues('password') || 'Passwords do not match',
                  })}
                />
                {errors.confirmPassword ? <small>{errors.confirmPassword.message}</small> : null}
              </label>
            </div>

            <button type="submit" className={styles.primaryButton} disabled={isLoading}>
              {isLoading ? 'Creating seller account...' : 'Create seller account'}
            </button>
          </form>

          <p className={styles.footerCopy}>
            Already have an account? <Link to="/auth/login">Login</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
