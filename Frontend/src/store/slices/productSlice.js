import { createSlice } from '@reduxjs/toolkit'
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  getSellerProducts,
  updateProduct,
} from '../../services/api/productApi'

function replaceProduct(products, updatedProduct) {
  return products.map((product) => (product._id === updatedProduct._id ? updatedProduct : product))
}

function prependIfMissing(products, productToAdd) {
  if (!productToAdd?._id) {
    return products
  }

  if (products.some((product) => product._id === productToAdd._id)) {
    return replaceProduct(products, productToAdd)
  }

  return [productToAdd, ...products]
}

const initialState = {
  products: [],
  productMeta: {
    total: 0,
    skip: 0,
    limit: 0,
    hasMore: false,
  },
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
        state.products = Array.isArray(action.payload?.items) ? action.payload.items : []
        state.productMeta = action.payload?.meta || initialState.productMeta
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
        if (!action.payload) {
          return
        }

        state.sellerProducts = prependIfMissing(state.sellerProducts, action.payload)
        state.products = prependIfMissing(state.products, action.payload)
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const updatedProduct = action.payload

        if (!updatedProduct?._id) {
          return
        }

        state.sellerProducts = replaceProduct(state.sellerProducts, updatedProduct)
        state.products = replaceProduct(state.products, updatedProduct)
        if (state.currentProduct?._id === updatedProduct._id) {
          state.currentProduct = updatedProduct
        }
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.sellerProducts = state.sellerProducts.filter((product) => product._id !== action.payload)
        state.products = state.products.filter((product) => product._id !== action.payload)
        if (state.currentProduct?._id === action.payload) {
          state.currentProduct = null
        }
      })
  },
})

export const { clearCurrentProduct, clearError } = productSlice.actions
export default productSlice.reducer
