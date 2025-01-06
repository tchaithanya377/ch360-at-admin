import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { db } from "../firebase";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";

const Faculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterDesignation, setFilterDesignation] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const facultyCollection = collection(db, "faculty");
        let filters = [];
        if (filterDepartment) filters.push(where("department", "==", filterDepartment));
        if (filterDesignation) filters.push(where("designation", "==", filterDesignation));
        const q = filters.length > 0 ? query(facultyCollection, ...filters) : facultyCollection;
        const querySnapshot = await getDocs(q);

        const fetchedFaculty = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setFaculty(fetchedFaculty);
      } catch (error) {
        console.error("Error fetching faculty:", error);
      }
    };

    fetchFaculty();
  }, [filterDepartment, filterDesignation]);

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const filteredFaculty = faculty.filter((member) =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewClick = (member) => {
    setSelectedFaculty(member);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedFaculty(null);
  };

  const handleEdit = (e) => {
    const { name, value } = e.target;
    setSelectedFaculty((prev) => ({ ...prev, [name]: value }));
  };

  const saveChanges = async () => {
    try {
      const facultyRef = doc(db, "faculty", selectedFaculty.id);
      await updateDoc(facultyRef, selectedFaculty);
      alert("Faculty details updated successfully!");
      setShowPopup(false);
    } catch (error) {
      console.error("Error updating faculty:", error);
      alert("Failed to update faculty details.");
    }
  };

  return (
    <div className="container mx-auto p-4 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search by name"
          value={searchTerm}
          onChange={handleSearch}
          className="p-2 border border-gray-300 rounded-md"
        />
        <div className="flex space-x-4">
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="IT">IT</option>
            <option value="DS">DS</option>
          </select>
          <select
            value={filterDesignation}
            onChange={(e) => setFilterDesignation(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="">All Designations</option>
            <option value="Professor">Professor</option>
            <option value="Associate Professor">Associate Professor</option>
            <option value="Assistant Professor">Assistant Professor</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-md">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Employee ID</th>
              <th className="py-2 px-4 border-b">Designation</th>
              <th className="py-2 px-4 border-b">Department Roll</th>
              <th className="py-2 px-4 border-b">Email</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFaculty.map((member) => (
              <tr key={member.id} className="hover:bg-gray-100 transition-colors">
                <td className="py-2 px-4 border-b">{member.name}</td>
                <td className="py-2 px-4 border-b">{member.empID}</td>
                <td className="py-2 px-4 border-b">{member.designation}</td>
                <td className="py-2 px-4 border-b">{member.depRole}</td>
                <td className="py-2 px-4 border-b">{member.emailID}</td>
                <td className="py-2 px-4 border-b">
                  <button
                    onClick={() => handleViewClick(member)}
                    className="text-blue-500 hover:underline"
                  >
                    <FontAwesomeIcon icon={faEye} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Popup */}
      {showPopup && selectedFaculty && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Edit Faculty Details</h2>
              <button
                onClick={handleClosePopup}
                className="text-gray-500 hover:text-gray-700"
              >
                ✖
              </button>
            </div>
            <div className="space-y-4">
              {Object.entries(selectedFaculty).map(
                ([key, value]) =>
                  key !== "id" && typeof value !== 'object' && (
                    <div key={key} className="flex flex-col">
                      <label className="font-semibold capitalize text-gray-700">
                        {key}
                      </label>
                      <input
                        type="text"
                        name={key}
                        value={value}
                        onChange={handleEdit}
                        className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={handleClosePopup}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveChanges}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faculty;
