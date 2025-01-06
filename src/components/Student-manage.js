import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { db } from "../firebase";
import { collection, collectionGroup, getDocs, doc, updateDoc } from "firebase/firestore";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  // Fetch Students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        let querySnapshot;

        if (filterYear && filterSection) {
          // Fetch students from a specific year and section
          const studentsPath = `students/${filterYear}/${filterSection}`;
          const studentsCollection = collection(db, studentsPath);
          querySnapshot = await getDocs(studentsCollection);
        } else {
          // Fetch all students across all years and sections
          querySnapshot = await getDocs(collectionGroup(db, "students"));
        }

        const fetchedStudents = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          path: doc.ref.parent.path, // To keep the path for updates
          ...doc.data(),
        }));

        // Sort students by roll number in ascending order
        fetchedStudents.sort((a, b) => {
          const rollA = parseInt(a.rollNo, 10) || 0;
          const rollB = parseInt(b.rollNo, 10) || 0;
          return rollA - rollB;
        });

        setStudents(fetchedStudents);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, [filterYear, filterSection]);

  // Handle Search
  const handleSearch = (e) => setSearchTerm(e.target.value);

  // Filter Students by Name
  const filteredStudents = students.filter((student) =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle Popup View
  const handleViewClick = (student) => {
    setSelectedStudent({ ...student }); // Create a shallow copy to avoid direct mutations
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedStudent(null);
  };

  // Handle Edit
  const handleEdit = (e) => {
    const { name, value } = e.target;
    setSelectedStudent((prev) => ({ ...prev, [name]: value }));
  };

  // Save Edited Student Data
  const saveChanges = async () => {
    try {
      const studentRef = doc(db, selectedStudent.path, selectedStudent.id);
      const updatedData = { ...selectedStudent };
      delete updatedData.path; // Remove extra metadata before saving
      await updateDoc(studentRef, updatedData);

      // Update state locally for better user feedback
      setStudents((prev) =>
        prev.map((student) =>
          student.id === selectedStudent.id ? { ...updatedData, id: student.id, path: student.path } : student
        )
      );

      alert("Student details updated successfully!");
      handleClosePopup();
    } catch (error) {
      console.error("Error updating student:", error);
      alert("Failed to update student details.");
    }
  };

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by name"
          value={searchTerm}
          onChange={handleSearch}
          className="p-2 border border-gray-300 rounded-md w-1/3"
        />

        {/* Filters */}
        <div className="flex space-x-4">
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="">All Years</option>
            <option value="I">1st Year</option>
            <option value="II">2nd Year</option>
            <option value="III">3rd Year</option>
            <option value="IV">4th Year</option>
          </select>
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="D">Section D</option>
            <option value="E">Section E</option>
            <option value="F">Section F</option>

          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-2 px-4 border">Name</th>
              <th className="py-2 px-4 border">Roll No</th>
              <th className="py-2 px-4 border">Year</th>
              <th className="py-2 px-4 border">Section</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr
                key={student.id}
                className="hover:bg-gray-100 transition-colors"
              >
                <td className="py-2 px-4 border">{student.name}</td>
                <td className="py-2 px-4 border">{student.rollNo}</td>
                <td className="py-2 px-4 border">{student.Year}</td>
                <td className="py-2 px-4 border">{student.Section}</td>
                <td className="py-2 px-4 border">
                  <button
                    onClick={() => handleViewClick(student)}
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
      {showPopup && selectedStudent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Edit Student Details</h2>
              <button
                onClick={handleClosePopup}
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="space-y-4">
              {Object.entries(selectedStudent).map(
                ([key, value]) =>
                  key !== "id" &&
                  key !== "path" && (
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

export default Students;
