import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { FullPageState } from '../components/FullPageState'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <FullPageState
      title="Page not found"
      description="That address does not lead anywhere in AlphaPulse. It may have moved, or it may never have existed."
      actions={
        <Button onClick={() => navigate('/app')}>Go to dashboard</Button>
      }
    />
  )
}
