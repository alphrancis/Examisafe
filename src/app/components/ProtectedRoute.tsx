import { Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
            Checking authentication...
        </div>
        );
    }

    if (!user) {
        return <Navigate to="/admin" replace />;
    }

    return <>{children}</>;
    }