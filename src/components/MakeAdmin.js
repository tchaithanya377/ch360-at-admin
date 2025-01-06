import React, { useState } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const MakeAdmin = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleMakeAdmin = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!email) {
        setError("Please enter a valid email.");
        setLoading(false);
        return;
      }

      // Reference to Firestore admin roles
      const adminRef = doc(db, "roles", "admin");
      const adminDoc = await getDoc(adminRef);

      let adminEmails = {};
      if (adminDoc.exists()) {
        adminEmails = adminDoc.data().emails || {};
      }

      // Add the new admin email
      adminEmails[email.toLowerCase()] = true;

      // Save back to Firestore
      await setDoc(adminRef, { emails: adminEmails }, { merge: true });
      setSuccess(`${email} has been successfully added as an admin.`);
    } catch (error) {
      setError(`Error adding admin: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-10 shadow-lg rounded-md w-96">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Add Admin
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 p-2 rounded mb-4 text-center">
            {success}
          </div>
        )}

        <div className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Admin Email
            </label>
            <input
              type="email"
              placeholder="Enter email to make admin"
              className="block w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleMakeAdmin}
            className={`block w-full py-2 rounded text-white ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } transition`}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Admin"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MakeAdmin;
