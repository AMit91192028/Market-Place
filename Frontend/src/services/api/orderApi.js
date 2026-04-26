import { createAsyncThunk } from '@reduxjs/toolkit'
import orderClient from './orderClient'
import { getApiErrorMessage } from './createServiceClient'

export const createOrder = createAsyncThunk(
  'order/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await orderClient.post('/', orderData)
      return response.data.order || response.data
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to create order'))
    }
  }
)

export const getMyOrders = createAsyncThunk(
  'order/getMyOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await orderClient.get('/me', { params })
      return response.data
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch orders'))
    }
  }
)

export const getOrderById = createAsyncThunk(
  'order/getOrderById',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await orderClient.get(`/${orderId}`)
      return response.data.order || response.data
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Order not found'))
    }
  }
)

export const cancelOrder = createAsyncThunk(
  'order/cancelOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await orderClient.post(`/${orderId}/cancel`)
      return response.data.order || response.data
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to cancel order'))
    }
  }
)

export const updateOrderAddress = createAsyncThunk(
  'order/updateOrderAddress',
  async ({ orderId, address }, { rejectWithValue }) => {
    try {
      const response = await orderClient.patch(`/${orderId}/address`, {
        shippingAddress: address,
      })
      return response.data.order || response.data
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to update order address'))
    }
  }
)
