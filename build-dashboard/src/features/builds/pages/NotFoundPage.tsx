import { Link } from 'react-router-dom'
import { EmptyState } from '@/shared/components/Misc'

const NotFoundPage = () => (
  <EmptyState title="No such page">
    <Link to="/">Back to the builds</Link>
  </EmptyState>
)

export default NotFoundPage
