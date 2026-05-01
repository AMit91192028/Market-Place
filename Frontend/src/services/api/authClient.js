import { createServiceClient } from './createServiceClient'

const authClient = createServiceClient(import.meta.env.VITE_AUTH_API_BASE, '/api/auth')

export default authClient
