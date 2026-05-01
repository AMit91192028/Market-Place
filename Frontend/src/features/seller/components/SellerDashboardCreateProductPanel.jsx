import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

const defaultValues = {
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
  onSubmit,
  isPublishing,
  onCancel,
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues })

  const selectedImages = watch('images')
  const [previewUrls, setPreviewUrls] = useState([])

  const selectedImageNames = useMemo(() => {
    return Array.from(selectedImages || []).map((file) => file.name)
  }, [selectedImages])

  useEffect(() => {
    const files = Array.from(selectedImages || [])
    const nextPreviewUrls = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }))

    setPreviewUrls(nextPreviewUrls)

    return () => {
      nextPreviewUrls.forEach((preview) => {
        URL.revokeObjectURL(preview.url)
      })
    }
  }, [selectedImages])

  return (
    <article className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.panelEyebrow}>New Listing</span>
          <h2>Create product in product service</h2>
        </div>
        <span className={styles.panelMeta}>Images are uploaded as multipart form data.</span>
      </div>

      <form className={styles.createForm} onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
        <label className={styles.fieldBlock}>
          <span>Product title</span>
          <input
            type="text"
            placeholder="Ex: Apple AirPods Pro"
            {...register('title', {
              required: 'Product title is required',
              validate: (value) => value.trim().length >= 3 || 'Use at least 3 characters',
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
              validate: (value) => value.trim().length >= 2 || 'Use at least 2 characters',
            })}
          />
          {errors.category ? <small>{errors.category.message}</small> : null}
        </label>

        <label className={styles.fieldBlock}>
          <span>Description</span>
          <textarea
            rows="5"
            placeholder="Write a clear product description"
            {...register('description', {
              required: 'Description is required',
              validate: (value) => value.trim().length >= 10 || 'Use at least 10 characters',
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
                required: 'Price is required',
                valueAsNumber: true,
                min: { value: 1, message: 'Price must be at least 1' },
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
                min: { value: 0, message: 'Stock cannot be negative' },
              })}
            />
            {errors.stock ? <small>{errors.stock.message}</small> : null}
          </label>
        </div>

        <label className={styles.fieldBlock}>
          <span>Images</span>
          <input type="file" accept="image/*" multiple {...register('images')} />
          <small>
            {selectedImageNames.length
              ? `${selectedImageNames.length} file${selectedImageNames.length === 1 ? '' : 's'} selected: ${selectedImageNames.join(', ')}`
              : 'Optional. Add up to 5 product images.'}
          </small>
        </label>

        {previewUrls.length ? (
          <div className={styles.previewGrid}>
            {previewUrls.map((preview) => (
              <figure key={preview.url} className={styles.previewCard}>
                <img src={preview.url} alt={preview.name} />
                <figcaption>{preview.name}</figcaption>
              </figure>
            ))}
          </div>
        ) : null}

        <div className={styles.cardActions}>
          <button type="submit" className={styles.primaryButton} disabled={isPublishing}>
            {isPublishing ? 'Publishing...' : 'Publish product'}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </article>
  )
}
