import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const ManageMentorsAndStudents = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch students based on year and section
  const fetchStudents = async () => {
    if (!selectedYear || !selectedSection) {
      alert("Please select a year and section!");
      return;
    }

    setLoading(true);
    try {
      const studentsRef = collection(
        db,
        `students/${selectedYear}/${selectedSection}`
      );
      const studentsQuery = query(studentsRef, orderBy("rollNo"));
      const studentsSnapshot = await getDocs(studentsQuery);

      const studentsData = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudents(studentsData);
      setSelectedStudents([]); // Reset selection
      setSelectAll(false);
    } catch (error) {
      console.error("Error fetching students:", error);
      alert("Failed to fetch students.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle student selection
  const toggleStudentSelection = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Handle "Select All" toggle
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((student) => student.id));
    }
    setSelectAll(!selectAll);
  };

  // Remove mentors for selected students
  const handleRemoveMentors = async () => {
    if (selectedStudents.length === 0) {
      alert("No students selected.");
      return;
    }

    const confirmRemove = window.confirm(
      "Are you sure you want to remove mentors for selected students?"
    );
    if (!confirmRemove) return;

    try {
      for (const studentId of selectedStudents) {
        const studentDocRef = doc(
          db,
          `students/${selectedYear}/${selectedSection}`,
          studentId
        );

        await updateDoc(studentDocRef, {
          mentorId: null,
          mentorName: null,
        });
      }
      alert("Mentors removed successfully.");
      fetchStudents(); // Refresh the student list
    } catch (error) {
      console.error("Error removing mentors:", error);
      alert("Failed to remove mentors. Please try again.");
    }
  };

  // Export displayed table data to Excel
const exportToExcel = () => {
  const tableData = students.map((student) => ({
    RollNo: student.rollNo,
    Name: student.name,
    Mentor: student.mentorName || "No Mentor",
  }));

  const worksheet = XLSX.utils.json_to_sheet(tableData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
  XLSX.writeFile(workbook, "students_table.xlsx");
};

// Export displayed table data to PDF
const exportToPDF = () => {
  const doc = new jsPDF();
  const tableData = students.map((student) => [
    student.rollNo,
    student.name,
    student.mentorName || "No Mentor",
  ]);

  autoTable(doc, {
    head: [["Roll No", "Name", "Mentor"]],
    body: tableData,
  });

  doc.save("students_table.pdf");
};


  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="bg-white shadow rounded-lg p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Manage Mentors and Students
        </h1>

        {/* Select Year and Section */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Year:
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-4 py-2"
              onChange={(e) => setSelectedYear(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>
                Select Year
              </option>
              <option value="I">1st Year</option>
              <option value="II">2nd Year</option>
              <option value="III">3rd Year</option>
              <option value="IV">4th Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Section:
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-4 py-2"
              onChange={(e) => setSelectedSection(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>
                Select Section
              </option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
        </div>

        <button
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
          onClick={fetchStudents}
        >
          Load Students
        </button>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="text-center mt-8 text-lg font-medium text-gray-600">
          Loading...
        </div>
      ) : (
        <div className="mt-8 max-w-4xl mx-auto bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">Students List</h2>
          {students.length === 0 ? (
            <p className="text-gray-600">
              No students found for the selected year and section.
            </p>
          ) : (
            <div>
              <table className="w-full table-auto border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-300 px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="border border-gray-300 px-4 py-2">Roll No</th>
                    <th className="border border-gray-300 px-4 py-2">Name</th>
                    <th className="border border-gray-300 px-4 py-2">Mentor</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="border border-gray-300 px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {student.rollNo}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {student.name}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {student.mentorName || "No Mentor"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex space-x-4">
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
                  onClick={handleRemoveMentors}
                >
                  Remove Mentors for Selected
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
                  onClick={exportToExcel}
                >
                  Export to Excel
                </button>
                <button
                  className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition"
                  onClick={exportToPDF}
                >
                  Export to PDF
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageMentorsAndStudents;
