import React, { useEffect, useState } from "react";
import { db } from "../firebase"; // Firebase configuration
import { collection, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";

const FacultyManager = () => {
  const [facultyData, setFacultyData] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [newCoordinator, setNewCoordinator] = useState(""); // Track the selected coordinator value
  const [loading, setLoading] = useState(true);

  // Fetch faculty data from Firestore
  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "faculty"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFacultyData(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching faculty data:", error);
      }
    };

    fetchFacultyData();
  }, []);

  // Handle faculty selection from dropdown
  const handleFacultyChange = (id) => {
    const faculty = facultyData.find((f) => f.id === id);
    setSelectedFaculty(faculty);
    setNewCoordinator(faculty?.coordinator || ""); // Default to current coordinator or empty
  };

  // Add or update the coordinator field in Firestore
  const handleUpdate = async () => {
    if (!selectedFaculty) {
      alert("Please select a faculty member first!");
      return;
    }

    if (!newCoordinator) {
      alert("Please select a valid coordinator option!");
      return;
    }

    const facultyDoc = doc(db, "faculty", selectedFaculty.id);

    try {
      // Check if the document exists
      const docSnap = await getDoc(facultyDoc);
      if (!docSnap.exists()) {
        alert("Error: Document does not exist. Please check the Firestore database.");
        return;
      }

      // Update the coordinator field in Firestore
      await updateDoc(facultyDoc, { coordinator: newCoordinator });
      alert("Coordinator updated successfully!");

      // Update local state to reflect changes
      setFacultyData((prevData) =>
        prevData.map((f) =>
          f.id === selectedFaculty.id ? { ...f, coordinator: newCoordinator } : f
        )
      );
      setSelectedFaculty((prev) => ({ ...prev, coordinator: newCoordinator }));
    } catch (error) {
      console.error("Error updating coordinator:", error);
      alert("Failed to update the coordinator. Please try again.");
    }
  };

  if (loading) {
    return <div className="text-center text-lg">Loading...</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Faculty Manager</h1>

      {/* Faculty Dropdown */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Faculty:
        </label>
        <select
          className="w-full border border-gray-300 rounded-lg px-4 py-2"
          onChange={(e) => handleFacultyChange(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>
            Select a faculty member
          </option>
          {facultyData.map((faculty) => (
            <option key={faculty.id} value={faculty.id}>
              {faculty.name || faculty.userId}
            </option>
          ))}
        </select>
      </div>

      {/* Coordinator Selection */}
      {selectedFaculty && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-lg font-semibold text-gray-800 mb-2">
            Selected Faculty: {selectedFaculty.name || selectedFaculty.userId}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Current Coordinator:{" "}
            <span className="font-medium text-gray-800">
              {selectedFaculty.coordinator || "N/A"}
            </span>
          </p>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assign Coordinator:
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            onChange={(e) => setNewCoordinator(e.target.value)}
            value={newCoordinator}
          >
            <option value="" disabled>
              Select a coordinator
            </option>
            <option value="NPTEL,NAASCOM,MATLAB">NPTEL, NAASCOM, MATLAB</option>
            <option value="Student">Student</option>
            <option value="Internship">Internship</option>
            {/* <option value="HOD">HOD</option> */}
            <option value="Palacement">Palacement</option>
            <option value="AICT_360_feedback">AICT_360_feedback</option>
            <option value="Project">Project</option>
            <option value="NAASCOM">NAASCOM</option>
            <option value="MATLAB">MATLAB</option>
          </select>

          <button
            className="mt-6 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            onClick={handleUpdate}
          >
            Update Coordinator
          </button>
        </div>
      )}
    </div>
  );
};

export default FacultyManager;
