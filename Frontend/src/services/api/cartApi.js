import { createAsyncThunk } from '@reduxjs/toolkit'
import cartClient from './cartClient'
import productClient from './productClient'
import { getApiErrorMessage } from './createServiceClient'
import { computeCartSummary } from '../../utils/marketplace'

async function hydrateCartPayload(payload) {
  const cart = payload?.cart || { items: [] }
  const items = await Promise.all(
    (cart.items || []).map(async (item) => {
      try {
        const response = await productClient.get(`/${item.productId}`)
        const product = response.data.data

        return {
          ...item,
          title: product?.title || 'Marketplace item',
          description: product?.description || 'Curated for your marketplace basket.',
          images: product?.images || [],
          stock: product?.stock || 0,
          currentPrice: product?.price || { amount: 0, currency: 'INR' },
        }
      } catch {
        return {
          ...item,
          title: 'Unavailable product',
          description: 'This item is temporarily unavailable.',
          images: [],
          stock: 0,
          currentPrice: { amount: 0, currency: 'INR' },
        }
      }
    })
  )

  return {
    rawCart: cart,
    items,
    itemCount: payload?.totals?.itemCount ?? items.length,
    totalQuantity:
      payload?.totals?.totalQuantity ?? items.reduce((sum, item) => sum + item.quantity, 0),
    ...computeCartSummary(items),
  }
}

export const getCart = createAsyncThunk(
  'cart/getCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartClient.get('/')
      return hydrateCartPayload(response.data)
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch cart'))
    }
  }
)

export const addItemToCart = createAsyncThunk(
  'cart/addItemToCart',
  async ({ productId, qty }, { rejectWithValue }) => {
    try {
      await cartClient.post('/items', { productId, qty })
      const refreshedCart = await cartClient.get('/')
      return hydrateCartPayload(refreshedCart.data)
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to add item to cart'))
    }
  }
)

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ productId, qty }, { rejectWithValue }) => {
    try {
      await cartClient.patch(`/items/${productId}`, { qty })
      const refreshedCart = await cartClient.get('/')
      return hydrateCartPayload(refreshedCart.data)
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to update cart item'))
    }
  }
)

export const removeCartItem = createAsyncThunk(
  'cart/removeCartItem',
  async (productId, { rejectWithValue }) => {
    try {
      await cartClient.delete(`/items/${productId}`)
      const refreshedCart = await cartClient.get('/')
      return hydrateCartPayload(refreshedCart.data)
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to remove item from cart'))
    }
  }
)

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      await cartClient.delete('/')
      return {
        rawCart: { items: [] },
        items: [],
        itemCount: 0,
        totalQuantity: 0,
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0,
      }
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to clear cart'))
    }
  }
)
