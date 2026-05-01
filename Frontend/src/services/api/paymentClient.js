import { createServiceClient } from './createServiceClient'

const paymentClient = createServiceClient(import.meta.env.VITE_PAYMENT_API_BASE, '/api/payments')

export default paymentClient
