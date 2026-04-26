import { createSlice } from '@reduxjs/toolkit'
import {
  cancelOrder,
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderAddress,
} from '../../services/api/orderApi'

const initialState = {
  orders: [],
  currentOrder: null,
  totalOrders: 0,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
}

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentOrder = action.payload
        state.orders.unshift(action.payload)
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(getMyOrders.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getMyOrders.fulfilled, (state, action) => {
        state.isLoading = false
        state.orders = action.payload.orders || []
        state.totalOrders = action.payload.meta?.total || 0
        state.currentPage = action.payload.meta?.page || 1
        state.totalPages = Math.max(
          1,
          Math.ceil((action.payload.meta?.total || 0) / (action.payload.meta?.limit || 10))
        )
      })
      .addCase(getMyOrders.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(getOrderById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getOrderById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentOrder = action.payload
      })
      .addCase(getOrderById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const updatedOrder = action.payload
        state.currentOrder =
          state.currentOrder?._id === updatedOrder._id ? updatedOrder : state.currentOrder
        state.orders = state.orders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        )
      })
      .addCase(updateOrderAddress.fulfilled, (state, action) => {
        const updatedOrder = action.payload
        state.currentOrder =
          state.currentOrder?._id === updatedOrder._id ? updatedOrder : state.currentOrder
        state.orders = state.orders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        )
      })
  },
})

export const { clearCurrentOrder, clearError } = orderSlice.actions
export default orderSlice.reducer
