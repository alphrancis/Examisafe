import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
        await login(email, password);
        navigate("/admin/dashboard");
        } catch (err: any) {
        setError("Invalid email or password");
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-8">
        <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-700">
            <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-gray-400 text-sm">TNHSA ExamiSafe Management</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                placeholder="juandelacruz@gmail.com"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                placeholder="••••••••"
                />
            </div>

            {error && (
                <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-base"
            >
                {loading ? "Signing in..." : "Sign In"}
            </button>
            </form>
        </div>
        </div>
    );
}