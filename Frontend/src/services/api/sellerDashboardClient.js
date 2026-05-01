import { createServiceClient } from './createServiceClient'

const sellerDashboardClient = createServiceClient(
  import.meta.env.VITE_SELLER_DASHBOARD_API_BASE || '/api/seller'
)

export default sellerDashboardClient
