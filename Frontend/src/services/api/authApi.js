import { createAsyncThunk } from '@reduxjs/toolkit'
import authClient from './authClient'
import { clearStoredAuthToken, getApiErrorMessage, setStoredAuthToken } from './createServiceClient'

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authClient.post('/register', userData)
      setStoredAuthToken(response.data.token)
      return response.data.user
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Registration failed'))
    }
  }
)

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authClient.post('/login', credentials)
      setStoredAuthToken(response.data.token)
      return response.data.user
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Login failed'))
    }
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authClient.get('/me')
      return response.data.user
    } catch (error) {
      if (error?.response?.status === 401) {
        clearStoredAuthToken()
      }

      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch user'))
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await authClient.get('/logout')
      clearStoredAuthToken()
      return null
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Logout failed'))
    }
  }
)

export const getUserAddresses = createAsyncThunk(
  'auth/getUserAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authClient.get('/users/me/addresses')
      return response.data.addresses || []
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch addresses'))
    }
  }
)

export const addUserAddress = createAsyncThunk(
  'auth/addUserAddress',
  async (addressData, { rejectWithValue }) => {
    try {
      const response = await authClient.post('/users/me/addresses', addressData)
      return response.data.address
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to add address'))
    }
  }
)

export const deleteUserAddress = createAsyncThunk(
  'auth/deleteUserAddress',
  async (addressId, { rejectWithValue }) => {
    try {
      await authClient.delete(`/users/me/addresses/${addressId}`)
      return addressId
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to delete address'))
    }
  }
)
