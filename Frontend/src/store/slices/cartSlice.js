import { createSlice } from '@reduxjs/toolkit'
import {
  addItemToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '../../services/api/cartApi'

const initialState = {
  items: [],
  rawCart: { items: [] },
  totalQuantity: 0,
  itemCount: 0,
  subtotal: 0,
  shipping: 0,
  tax: 0,
  total: 0,
  isLoading: false,
  error: null,
}

function applyCartPayload(state, payload) {
  state.rawCart = payload.rawCart
  state.items = payload.items || []
  state.totalQuantity = payload.totalQuantity || 0
  state.itemCount = payload.itemCount || 0
  state.subtotal = payload.subtotal || 0
  state.shipping = payload.shipping || 0
  state.tax = payload.tax || 0
  state.total = payload.total || 0
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCart.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getCart.fulfilled, (state, action) => {
        state.isLoading = false
        applyCartPayload(state, action.payload)
      })
      .addCase(getCart.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(addItemToCart.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(addItemToCart.fulfilled, (state, action) => {
        state.isLoading = false
        applyCartPayload(state, action.payload)
      })
      .addCase(addItemToCart.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        applyCartPayload(state, action.payload)
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        applyCartPayload(state, action.payload)
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        applyCartPayload(state, action.payload)
      })
  },
})

export const { clearError } = cartSlice.actions
export default cartSlice.reducer
