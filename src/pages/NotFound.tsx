import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/ui';

export default function NotFound() {
  return (
    <div className="space-y-6">
      <EmptyState
        icon={<Compass size={22} />}
        title="Page not found"
        message="The page you are looking for does not exist or has moved."
        action={<Link to="/" className="btn-primary mt-2">Back to dashboard</Link>}
      />
    </div>
  );
}
