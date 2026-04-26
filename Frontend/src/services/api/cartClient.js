import { createServiceClient } from './createServiceClient'

const cartClient = createServiceClient(import.meta.env.VITE_CART_API_BASE || '/api/cart')


export default cartClient
