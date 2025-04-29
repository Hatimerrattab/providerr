import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  console.log("🔍 Token from URL (search param):", token);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ text: "", isError: false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setMessage({ text: "", isError: false });

    // Validation checks
    if (!token) {
      return setMessage({ 
        text: "Invalid reset link. Please request a new password reset.", 
        isError: true 
      });
    }

    if (password.length < 8) {
      return setMessage({ 
        text: "Password must be at least 8 characters", 
        isError: true 
      });
    }

    if (password !== confirmPassword) {
      return setMessage({ 
        text: "Passwords do not match.", 
        isError: true 
      });
    }

    setLoading(true);
    try {
      
      console.log("📤 Sending reset request with token:", token);
      console.log("🔐 New password:", password);

      const res =await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/reset-password`,
        { password, token }
      );      

      setMessage({ 
        text: "Password reset successful! Redirecting to login...", 
        isError: false 
      });
      setTimeout(() => navigate("/auth/login"), 3000);
    } catch (err) {
      console.error("Password reset error:", err);
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         "Failed to reset password. Please try again.";
      setMessage({ text: errorMessage, isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-8">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Reset Your Password</h2>
        
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-center text-sm ${
            message.isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter new password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength="8"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength="8"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className={`w-full p-3 text-white rounded-lg transition duration-200 ${
              loading || !token 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-[#076870] hover:bg-blue-700"
            }`}
          >
            {loading ? "Processing..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}