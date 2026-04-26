import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { createProduct } from '../../../services/api/productApi'
import styles from '../styles/Product.module.css'

export default function CreateProductPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isLoading, error } = useSelector((state) => state.product)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      priceCurrency: 'INR',
      stock: 10,
    },
  })

  async function onSubmit(values) {
    const formData = new FormData()
    formData.append('title', values.title)
    formData.append('description', values.description)
    formData.append('priceAmount', values.priceAmount)
    formData.append('priceCurrency', values.priceCurrency)
    formData.append('stock', values.stock)

    const files = Array.from(values.images || [])
    files.forEach((file) => formData.append('images', file))

    try {
      await dispatch(createProduct(formData)).unwrap()
      reset()
      navigate('/seller/products')
    } catch {
      return null
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>Seller onboarding</span>
          <h1>Create a new listing</h1>
          <p>Upload images, set your live price, and define stock so orders can be created successfully.</p>
        </div>
      </div>

      <div className={styles.createCard}>
        {error ? <div className={styles.errorBanner}>{error}</div> : null}

        <form className={styles.createForm} onSubmit={handleSubmit(onSubmit)}>
          <label className={styles.fieldBlock}>
            <span>Product title</span>
            <input type="text" {...register('title', { required: 'Title is required' })} />
            {errors.title ? <small>{errors.title.message}</small> : null}
          </label>

          <label className={styles.fieldBlock}>
            <span>Description</span>
            <textarea {...register('description')} />
          </label>

          <div className={styles.sellerInlineFields}>
            <label className={styles.fieldBlock}>
              <span>Price amount</span>
              <input
                type="number"
                {...register('priceAmount', { required: 'Price amount is required', min: 1 })}
              />
            </label>

            <label className={styles.fieldBlock}>
              <span>Currency</span>
              <select {...register('priceCurrency')}>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
              </select>
            </label>

            <label className={styles.fieldBlock}>
              <span>Stock</span>
              <input type="number" {...register('stock', { required: 'Stock is required', min: 0 })} />
            </label>
          </div>

          <label className={styles.fieldBlock}>
            <span>Images</span>
            <input type="file" accept="image/*" multiple {...register('images')} />
          </label>

          <button type="submit" className={styles.primaryButton} disabled={isLoading}>
            {isLoading ? 'Publishing...' : 'Publish product'}
          </button>
        </form>
      </div>
    </section>
  )
}
