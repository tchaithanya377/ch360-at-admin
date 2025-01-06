import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Firebase instance
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User logged in:", user);

        const userRef = doc(db, "users", user.uid);
        try {
          await setDoc(
            userRef,
            {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || "N/A",
              creationTime: user.metadata.creationTime,
            },
            { merge: true }
          );
          console.log("User data saved to Firestore");
        } catch (error) {
          console.error("Error saving user data:", error);
        }
      }
    });

    return () => unsubscribe(); // Cleanup subscription
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const userList = querySnapshot.docs.map((doc) => doc.data());
      console.log("Fetched users from Firestore:", userList);
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">All Users</h1>
      {loading ? (
        <p className="text-center text-blue-600 font-medium">Loading...</p>
      ) : (
        <table className="table-auto w-full bg-white shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Display Name</th>
              <th className="px-4 py-2">Creation Time</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-4 py-2 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr key={user.uid || index} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">{user.displayName}</td>
                  <td className="px-4 py-2">{user.creationTime}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserList;
