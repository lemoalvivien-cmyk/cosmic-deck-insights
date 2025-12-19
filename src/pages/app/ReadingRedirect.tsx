import { Navigate, useParams } from 'react-router-dom';

// Redirect from legacy /app/lecture/:id to canonical /app/reading/:id
export default function ReadingRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/app/reading/${id}`} replace />;
}
