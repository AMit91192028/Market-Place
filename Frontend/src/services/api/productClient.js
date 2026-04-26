import { createServiceClient } from './createServiceClient'

const productClient = createServiceClient(import.meta.env.VITE_PRODUCT_API_BASE)

export default productClient
