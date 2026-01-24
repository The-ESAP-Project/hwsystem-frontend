import { Navigate } from "react-router";

export function UserIndexPage() {
  return <Navigate to="/user/dashboard" replace />;
}
