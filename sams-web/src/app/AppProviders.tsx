import { RouterProvider } from 'react-router-dom'
import { FirebaseConfigurationNotice } from '../components/common/FirebaseConfigurationNotice'
import { AuthProvider } from '../contexts/AuthContext'
import { router } from '../routes/router'

export function AppProviders() {
  return (
    <AuthProvider>
      <FirebaseConfigurationNotice />
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
