import { createServiceClient } from './createServiceClient'

const orderClient = createServiceClient(import.meta.env.VITE_ORDER_API_BASE, '/api/orders')

export default orderClient
