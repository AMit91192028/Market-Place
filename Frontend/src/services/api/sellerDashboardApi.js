import { createAsyncThunk } from '@reduxjs/toolkit'
import sellerDashboardClient from './sellerDashboardClient'
import { getApiErrorMessage } from './createServiceClient'

export const getSellerMetrics = createAsyncThunk(
  'sellerDashboard/getSellerMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await sellerDashboardClient.get('/metrics')
      return response.data
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch seller metrics'))
    }
  }
)

export const getSellerOrders = createAsyncThunk(
  'sellerDashboard/getSellerOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await sellerDashboardClient.get('/orders')
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch seller orders'))
    }
  }
)

export const getSellerDashboardProducts = createAsyncThunk(
  'sellerDashboard/getSellerDashboardProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await sellerDashboardClient.get('/products')
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch seller catalog snapshot'))
    }
  }
)
