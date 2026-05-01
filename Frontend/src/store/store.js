import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import productReducer from './slices/productSlice'
import cartReducer from './slices/cartSlice'
import orderReducer from './slices/orderSlice'
import paymentReducer from './slices/paymentSlice'
import sellerDashboardReducer from './slices/sellerDashboardSlice'


export const store = configureStore({
  reducer: {
    auth: authReducer,
    product: productReducer,
    cart: cartReducer,
    order: orderReducer,
    payment: paymentReducer,
    sellerDashboard: sellerDashboardReducer,
  },
})

export default store
