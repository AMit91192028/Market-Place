import { useMemo } from 'react'
import { useForm } from 'react-hook-form'

const DEFAULT_VALUES = {
  title: '',
  category: '',
  description: '',
  priceAmount: 999,
  priceCurrency: 'INR',
  stock: 10,
  images: null,
}

export default function SellerDashboardCreateProductPanel({
  styles,
  handleCreateSubmit,
  isPublishing,
  setComposerOpen,
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: DEFAULT_VALUES,
  })

  const selectedImages = watch('images')
  const selectedImageNames = useMemo(() => {
    return Array.from(selectedImages || []).map((file) => file.name)
  }, [selectedImages])

  return (
    <article className={`${styles.panel} ${styles.createComposer}`} id="seller-create-form">
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.panelLabel}>Add product</span>
          <h2>Create a new seller listing</h2>
        </div>
        <span className={styles.panelMeta}>Description is sent as plain text.</span>
      </div>

      <form
        className={styles.createForm}
        onSubmit={handleSubmit(handleCreateSubmit)}
        encType="multipart/form-data"
      >
        <label className={styles.fieldBlock}>
          <span>Product title</span>
          <input
            type="text"
            placeholder="Ex: AirPods Pro (2nd generation)"
            {...register('title', {
              required: 'Product title is required',
              validate: (value) => value.trim().length > 2 || 'Enter a more descriptive title',
            })}
          />
          {errors.title ? <small>{errors.title.message}</small> : null}
        </label>

        <label className={styles.fieldBlock}>
          <span>Category</span>
          <input
            type="text"
            placeholder="Ex: electronics, fashion, home"
            {...register('category', {
              required: 'Category is required',
              validate: (value) => value.trim().length > 1 || 'Enter a valid category',
            })}
          />
          {errors.category ? <small>{errors.category.message}</small> : null}
        </label>

        <label className={styles.fieldBlock}>
          <span>Description</span>
          <textarea
            placeholder="Write a short product description"
            {...register('description', {
              required: 'Description is required',
              validate: (value) => value.trim().length > 10 || 'Description should be at least 10 characters',
            })}
          />
          {errors.description ? <small>{errors.description.message}</small> : null}
        </label>

        <div className={styles.inlineFields}>
          <label className={styles.fieldBlock}>
            <span>Price amount</span>
            <input
              type="number"
              min="1"
              step="1"
              {...register('priceAmount', {
                required: 'Price amount is required',
                valueAsNumber: true,
                min: {
                  value: 1,
                  message: 'Price amount must be at least 1',
                },
              })}
            />
            {errors.priceAmount ? <small>{errors.priceAmount.message}</small> : null}
          </label>

          <label className={styles.fieldBlock}>
            <span>Currency</span>
            <select {...register('priceCurrency', { required: true })}>
              <option value="INR">INR</option>
              <option value="USD">USD</option>
            </select>
          </label>

          <label className={styles.fieldBlock}>
            <span>Stock</span>
            <input
              type="number"
              min="0"
              step="1"
              {...register('stock', {
                required: 'Stock is required',
                valueAsNumber: true,
                min: {
                  value: 0,
                  message: 'Stock cannot be negative',
                },
              })}
            />
            {errors.stock ? <small>{errors.stock.message}</small> : null}
          </label>
        </div>

        <label className={styles.fieldBlock}>
          <span>Images</span>
          <input
            type="file"
            accept="image/*"
            multiple
            {...register('images')}
          />
          {selectedImageNames.length ? <small>{selectedImageNames.join(', ')}</small> : null}
        </label>

        <div className={styles.cardActions}>
          <button type="submit" className={styles.primaryButton} disabled={isPublishing}>
            {isPublishing ? 'Publishing...' : 'Publish product'}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => setComposerOpen(false)}>
            Cancel
          </button>
        </div>
      </form>
    </article>
  )
}
