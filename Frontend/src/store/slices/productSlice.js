import { createSlice } from '@reduxjs/toolkit'
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  getSellerProducts,
  updateProduct,
} from '../../services/api/productApi'

const initialState = {
  products: [],
  currentProduct: null,
  sellerProducts: [],
  isLoading: false,
  error: null,
}

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getProducts.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.isLoading = false
        state.products = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(getProductById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getProductById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentProduct = action.payload
      })
      .addCase(getProductById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(getSellerProducts.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getSellerProducts.fulfilled, (state, action) => {
        state.isLoading = false
        state.sellerProducts = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(getSellerProducts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(createProduct.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.isLoading = false
        state.sellerProducts.unshift(action.payload)
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const updatedProduct = action.payload
        state.sellerProducts = state.sellerProducts.map((product) =>
          product._id === updatedProduct._id ? updatedProduct : product
        )
        if (state.currentProduct?._id === updatedProduct._id) {
          state.currentProduct = updatedProduct
        }
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.sellerProducts = state.sellerProducts.filter((product) => product._id !== action.payload)
      })
  },
})

export const { clearCurrentProduct, clearError } = productSlice.actions
export default productSlice.reducer
