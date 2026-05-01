import { createSlice } from '@reduxjs/toolkit'
import { createPaymentIntent, verifyPayment } from '../../services/api/paymentApi'

const initialState = {
  currentPayment: null,
  isCreating: false,
  isVerifying: false,
  error: null,
}

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearPaymentError: (state) => {
      state.error = null
    },
    resetPaymentState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPaymentIntent.pending, (state) => {
        state.isCreating = true
        state.error = null
      })
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.isCreating = false
        state.currentPayment = action.payload
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.isCreating = false
        state.error = action.payload
      })
      .addCase(verifyPayment.pending, (state) => {
        state.isVerifying = true
        state.error = null
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.isVerifying = false
        state.currentPayment = action.payload
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.isVerifying = false
        state.error = action.payload
      })
  },
})

export const { clearPaymentError, resetPaymentState } = paymentSlice.actions
export default paymentSlice.reducer
