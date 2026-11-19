import { CloudOff } from 'lucide-react'
import { isFirebaseConfigured } from '../../lib/firebase'

export function FirebaseConfigurationNotice() {
  if (isFirebaseConfigured) return null

  return (
    <div className="firebase-notice" role="status">
      <CloudOff size={16} aria-hidden="true" />
      <span>Cloud services are not connected. Add the Firebase values to <code>.env</code> to enable them.</span>
    </div>
  )
}
