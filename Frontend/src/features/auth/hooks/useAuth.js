import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getCurrentUser } from '../../../services/api/authApi'

export function useAuth() {
  const auth = useSelector((state) => state.auth)
  return auth
}

export function useInitializeAuth() {
  const dispatch = useDispatch()
  const { authChecked, isLoading } = useSelector((state) => state.auth)

  useEffect(() => {
    if (!authChecked && !isLoading) {
      dispatch(getCurrentUser())
    }
  }, [authChecked, dispatch, isLoading])
}
