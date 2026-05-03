import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../lib/api.js';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  if (!auth.isAuthed()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
