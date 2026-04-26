import { createSlice } from '@reduxjs/toolkit'
import {
  addUserAddress,
  deleteUserAddress,
  getCurrentUser,
  getUserAddresses,
  loginUser,
  logoutUser,
  registerUser,
} from '../../services/api/authApi'

const initialState = {
  user: null,
  isAuthenticated: false,
  authChecked: false,
  role: null,
  addresses: [],
  isLoading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.authChecked = true
        state.role = action.payload?.role || null
        state.addresses = action.payload?.addresses || []
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.authChecked = true
        state.error = action.payload
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.authChecked = true
        state.role = action.payload?.role || null
        state.addresses = action.payload?.addresses || []
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.authChecked = true
        state.error = action.payload
      })
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.authChecked = true
        state.role = action.payload?.role || null
        state.addresses = action.payload?.addresses || []
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.isLoading = false
        state.user = null
        state.isAuthenticated = false
        state.authChecked = true
        state.role = null
        state.addresses = []
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.authChecked = true
        state.role = null
        state.addresses = []
      })
      .addCase(getUserAddresses.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getUserAddresses.fulfilled, (state, action) => {
        state.isLoading = false
        state.addresses = action.payload || []
      })
      .addCase(getUserAddresses.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(addUserAddress.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(addUserAddress.fulfilled, (state, action) => {
        state.isLoading = false
        state.addresses.push(action.payload)
      })
      .addCase(addUserAddress.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(deleteUserAddress.fulfilled, (state, action) => {
        state.addresses = state.addresses.filter((address) => address._id !== action.payload)
      })
  },
})

export const { clearError } = authSlice.actions
export default authSlice.reducer
