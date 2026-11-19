import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import type { User } from 'firebase/auth'
import {
  AuthServiceError,
  firebaseAuthErrorMessage,
  logoutUser,
  observeAuthChanges,
  registerWithEmail,
  requestPasswordReset,
  resendVerificationEmail as sendVerificationEmail,
  resolveUserAccess,
  signInWithEmail,
} from '../services/authService'
import { updateUserProfile } from '../services/userService'
import type { AuthContextValue, AuthState } from '../types/auth'
import { isFirebaseConfigured } from '../lib/firebase'
import { AuthContext } from './auth-context'

const initialState: AuthState = {
  user: null,
  profile: null,
  role: null,
  authLoading: isFirebaseConfigured,
  profileLoading: false,
  accessError: null,
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>(initialState)
  const generation = useRef(0)

  useEffect(() => {
    if (!isFirebaseConfigured) return

    let active = true
    const unsubscribe = observeAuthChanges((user) => {
      const currentGeneration = ++generation.current
      if (!user) {
        setState({ ...initialState, authLoading: false })
        return
      }

      setState({
        user,
        profile: null,
        role: null,
        authLoading: false,
        profileLoading: true,
        accessError: null,
      })

      hydrateUser(user, () => active && generation.current === currentGeneration)
    }, (error) => {
      if (active) {
        setState({ ...initialState, authLoading: false, accessError: firebaseAuthErrorMessage(error) })
      }
    })

    return () => {
      active = false
      generation.current += 1
      unsubscribe()
    }
  }, [])

  const login = useCallback(async (email: string, password: string, rememberSession: boolean) => {
    const { user, access } = await signInWithEmail(email, password, rememberSession)
    setState({
      user,
      profile: access.profile,
      role: access.role,
      authLoading: false,
      profileLoading: false,
      accessError: null,
    })
    return access.role
  }, [])

  const register = useCallback((displayName: string, email: string, password: string) => (
    registerWithEmail(displayName, email, password)
  ), [])

  const logout = useCallback(async () => {
    await logoutUser()
    setState({ ...initialState, authLoading: false })
  }, [])

  const resetPassword = useCallback((email: string) => requestPasswordReset(email), [])

  const resendVerificationEmail = useCallback(async () => {
    if (!state.user) {
      throw new AuthServiceError('auth/no-current-user', 'Sign in to request another verification email.')
    }
    await sendVerificationEmail(state.user)
  }, [state.user])

  const refreshSession = useCallback(async () => {
    if (!state.user) {
      throw new AuthServiceError('auth/no-current-user', 'Sign in before refreshing your account.')
    }
    await state.user.reload()
    await state.user.getIdToken(true)
    const { role, profile } = await resolveUserAccess(state.user)
    setState({
      user: state.user,
      profile,
      role,
      authLoading: false,
      profileLoading: false,
      accessError: null,
    })
    return role
  }, [state.user])

  const updateProfile = useCallback(async (displayName: string) => {
    if (!state.user) {
      throw new AuthServiceError('auth/no-current-user', 'Sign in before updating your profile.')
    }
    const profile = await updateUserProfile(state.user.uid, displayName)
    setState((current) => ({ ...current, profile, accessError: null }))
  }, [state.user])

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    login,
    register,
    logout,
    resetPassword,
    resendVerificationEmail,
    refreshSession,
    updateProfile,
  }), [
    state,
    login,
    register,
    logout,
    resetPassword,
    resendVerificationEmail,
    refreshSession,
    updateProfile,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>

  function hydrateUser(user: User, isCurrent: () => boolean) {
    void resolveUserAccess(user)
      .then(({ role, profile }) => {
        if (!isCurrent()) return
        setState({
          user,
          profile,
          role,
          authLoading: false,
          profileLoading: false,
          accessError: null,
        })
      })
      .catch((error: unknown) => {
        if (!isCurrent()) return
        setState({
          user,
          profile: null,
          role: null,
          authLoading: false,
          profileLoading: false,
          accessError: firebaseAuthErrorMessage(error),
        })
      })
  }
}
