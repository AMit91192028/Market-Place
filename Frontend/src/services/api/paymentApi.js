import { createAsyncThunk } from '@reduxjs/toolkit'
import paymentClient from './paymentClient'
import { getApiErrorMessage } from './createServiceClient'

export const createPaymentIntent = createAsyncThunk(
  'payment/createPaymentIntent',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await paymentClient.post(`/create/${orderId}`)
      return response.data.payment || response.data
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to create payment'))
    }
  }
)

export const verifyPayment = createAsyncThunk(
  'payment/verifyPayment',
  async ({ razorpayOrderId, paymentId, signature }, { rejectWithValue }) => {
    try {
      const response = await paymentClient.post('/verify', {
        razorpayOrderId,
        paymentId,
        signature,
      })
      return response.data.payment || response.data
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to verify payment'))
    }
  }
)
