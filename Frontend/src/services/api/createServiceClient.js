import axios from 'axios'

export function createServiceClient(baseURL) {
  console.log(baseURL);
  return axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      Accept: 'application/json',
    },
  })
}

export function getApiErrorMessage(error, fallbackMessage) {
  const data = error?.response?.data

  if (data?.message) {
    return data.message
  }

  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors[0]?.msg || fallbackMessage
  }

  if (data?.error) {
    return data.error
  }

  return fallbackMessage
}
