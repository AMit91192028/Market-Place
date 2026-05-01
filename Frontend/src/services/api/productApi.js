import { createAsyncThunk } from '@reduxjs/toolkit'
import productClient from './productClient'
import { getApiErrorMessage } from './createServiceClient'

export const getProducts = createAsyncThunk(
  'product/getProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await productClient.get('/', { params })
      return response.data.data || []
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch products'))
    }
  }
)

export const getProductById = createAsyncThunk(
  'product/getProductById',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await productClient.get(`/${productId}`)
      return response.data.data
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Product not found'))
    }
  }
)

export const getSellerProducts = createAsyncThunk(
  'product/getSellerProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await productClient.get('/seller', { params })
      return response.data.data || []
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch seller products'))
    }
  }
)

export const createProduct = createAsyncThunk(
  'product/createProduct',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await productClient.post('/', formData)
      return response.data.data
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to create product'))
    }
  }
)

export const updateProduct = createAsyncThunk(
  'product/updateProduct',
  async ({ productId, data }, { rejectWithValue }) => {
    try {
      const response = await productClient.patch(`/${productId}`, data)
      return response.data.product || response.data.data || response.data
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to update product'))
    }
  }
)

export const deleteProduct = createAsyncThunk(
  'product/deleteProduct',
  async (productId, { rejectWithValue }) => {
    try {
      await productClient.delete(`/${productId}`)
      return productId
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to delete product'))
    }
  }
)
