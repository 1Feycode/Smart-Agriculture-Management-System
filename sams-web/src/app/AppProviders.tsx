import { RouterProvider } from 'react-router-dom'
import { FirebaseConfigurationNotice } from '../components/common/FirebaseConfigurationNotice'
import { router } from '../routes/router'

export function AppProviders() {
  return (
    <>
      <FirebaseConfigurationNotice />
      <RouterProvider router={router} />
    </>
  )
}
