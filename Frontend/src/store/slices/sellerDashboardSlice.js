import { createSlice } from '@reduxjs/toolkit'
import {
  getSellerDashboardProducts,
  getSellerMetrics,
  getSellerOrders,
} from '../../services/api/sellerDashboardApi'

const initialMetrics = {
  sales: 0,
  revenue: 0,
  topProducts: [],
  totalOrders: 0,
  pendingOrders: 0,
  paidOrders: 0,
}

const initialState = {
  metrics: initialMetrics,
  orders: [],
  products: [],
  isLoadingMetrics: false,
  isLoadingOrders: false,
  isLoadingProducts: false,
  error: null,
}

const sellerDashboardSlice = createSlice({
  name: 'sellerDashboard',
  initialState,
  reducers: {
    clearSellerDashboardError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSellerMetrics.pending, (state) => {
        state.isLoadingMetrics = true
        state.error = null
      })
      .addCase(getSellerMetrics.fulfilled, (state, action) => {
        state.isLoadingMetrics = false
        state.metrics = { ...initialMetrics, ...action.payload }
      })
      .addCase(getSellerMetrics.rejected, (state, action) => {
        state.isLoadingMetrics = false
        state.error = action.payload
      })
      .addCase(getSellerOrders.pending, (state) => {
        state.isLoadingOrders = true
        state.error = null
      })
      .addCase(getSellerOrders.fulfilled, (state, action) => {
        state.isLoadingOrders = false
        state.orders = action.payload
      })
      .addCase(getSellerOrders.rejected, (state, action) => {
        state.isLoadingOrders = false
        state.error = action.payload
      })
      .addCase(getSellerDashboardProducts.pending, (state) => {
        state.isLoadingProducts = true
        state.error = null
      })
      .addCase(getSellerDashboardProducts.fulfilled, (state, action) => {
        state.isLoadingProducts = false
        state.products = action.payload
      })
      .addCase(getSellerDashboardProducts.rejected, (state, action) => {
        state.isLoadingProducts = false
        state.error = action.payload
      })
  },
})

export const { clearSellerDashboardError } = sellerDashboardSlice.actions
export default sellerDashboardSlice.reducer
