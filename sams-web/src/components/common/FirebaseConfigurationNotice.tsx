import { CloudOff } from 'lucide-react'
import { isFirebaseConfigured, missingFirebaseKeys } from '../../lib/firebase'

export function FirebaseConfigurationNotice() {
  if (isFirebaseConfigured) return null
  const missingSettings = missingFirebaseKeys
    .map((key) => `VITE_FIREBASE_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`)
    .join(', ')

  return (
    <div className="firebase-notice" role="status">
      <CloudOff size={16} aria-hidden="true" />
      <span>Cloud services are not connected. Add the missing settings to <code>.env</code>: <code>{missingSettings}</code>.</span>
    </div>
  )
}
