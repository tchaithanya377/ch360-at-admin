import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // List of Admin Emails
  const adminEmails = ["23695a3201@mits.ac.in", "admin@mits.ac.in"]; // Add your admin emails here

  const isAdmin = (email) => adminEmails.includes(email.toLowerCase());

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const sanitizedEmail = email.trim().toLowerCase();
      const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);

      const loggedInEmail = userCredential.user.email;

      // Check if the user is an admin
      if (!isAdmin(loggedInEmail)) {
        setError("You are not authorized to access this page.");
        await auth.signOut(); // Sign out unauthorized users
        setLoading(false);
        return;
      }

      // Login successful
      navigate("/dashboard");
    } catch (error) {
      // Handle Firebase login errors
      if (error.code === "auth/user-not-found") {
        setError("User not found. Please check your email.");
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600">
      <div className="bg-white p-8 shadow-lg rounded-md w-96">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Admin Login
        </h2>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="block w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="block w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            className={`block w-full py-2 rounded text-white ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            } transition`}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
