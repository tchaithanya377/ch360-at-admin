import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";

const AssignMentor = () => {
  const [facultyData, setFacultyData] = useState([]);
  const [studentData, setStudentData] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [numStudentsToAssign, setNumStudentsToAssign] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch faculty data
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const facultySnapshot = await getDocs(collection(db, "faculty"));
        const fetchedFaculty = facultySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFacultyData(fetchedFaculty);
      } catch (error) {
        console.error("Error fetching faculty data:", error);
        alert("Failed to fetch faculty data. Please try again.");
      }
    };

    fetchFaculty();
  }, []);

  // Fetch students dynamically based on year and section
  const fetchStudents = async () => {
    if (!selectedYear || !selectedSection) {
      setError("Please select a year and section!");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const studentsRef = collection(
        db,
        `students/${selectedYear}/${selectedSection}`
      );
      const studentsQuery = query(studentsRef, orderBy("rollNo"));
      const querySnapshot = await getDocs(studentsQuery);

      const fetchedStudents = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((student) => !student.mentorId);

      setStudentData(fetchedStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      alert("Failed to fetch students. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Assign mentor to students
  const handleAssignMentor = async () => {
    if (
      !selectedFaculty ||
      !selectedYear ||
      !selectedSection ||
      numStudentsToAssign <= 0
    ) {
      setError(
        "Please select a faculty member, year, section, and valid number of students to assign!"
      );
      return;
    }
    setError("");
    if (numStudentsToAssign > studentData.length) {
      alert(`Only ${studentData.length} students are available to assign.`);
      return;
    }

    try {
      const studentsToAssign = studentData.slice(0, numStudentsToAssign);
      const studentIdsToUpdate = [];

      const studentUpdates = studentsToAssign.map(async (student) => {
        const studentDoc = doc(
          db,
          `students/${selectedYear}/${selectedSection}`,
          student.id
        );
        await updateDoc(studentDoc, {
          mentorId: selectedFaculty.id,
          mentorName: selectedFaculty.name,
        });
        studentIdsToUpdate.push(student.id);
      });

      await Promise.all(studentUpdates);

      const facultyDoc = doc(db, "faculty", selectedFaculty.id);
      const existingStudentIds = selectedFaculty.mantis_student_id || [];
      await updateDoc(facultyDoc, {
        mantis_student_id: [...existingStudentIds, ...studentIdsToUpdate],
      });

      alert(
        `Mentor ${selectedFaculty.name} (ID: ${selectedFaculty.id}) assigned to ${numStudentsToAssign} students in ${selectedYear} ${selectedSection}.`
      );

      setStudentData((prevData) =>
        prevData.filter(
          (student) => !studentsToAssign.some((s) => s.id === student.id)
        )
      );
    } catch (error) {
      console.error("Error assigning mentor:", error);
      alert("Failed to assign mentor. Please try again.");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-blue-100 via-white to-blue-50">
      <h1 className="text-4xl font-extrabold text-gray-800 text-center mb-10">
        Assign Faculty Mentor
      </h1>

      {error && (
        <p className="text-red-500 bg-red-100 p-2 rounded-md mb-4">{error}</p>
      )}

      <div className="bg-white shadow-lg rounded-lg p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Select Faculty:
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-600"
              onChange={(e) =>
                setSelectedFaculty(
                  facultyData.find((faculty) => faculty.id === e.target.value)
                )
              }
              defaultValue=""
            >
              <option value="" disabled>
                Select a faculty member
              </option>
              {facultyData.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name} (ID: {faculty.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Select Year and Section:
            </label>
            <div className="flex space-x-4">
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-600"
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
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-600"
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
        </div>

        <div className="mt-8 flex space-x-6">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition font-medium"
            onClick={fetchStudents}
          >
            Fetch Students
          </button>
          <div className="flex items-center space-x-4">
            <label className="text-lg font-semibold text-gray-700">
              Students to Assign:
            </label>
            <input
              type="number"
              className="w-20 border border-gray-300 rounded-lg px-4 py-2 text-gray-600"
              value={numStudentsToAssign}
              onChange={(e) =>
                setNumStudentsToAssign(parseInt(e.target.value, 10))
              }
            />
          </div>
        </div>
      </div>

      {studentData.length > 0 && (
        <div className="mt-8 max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Students Without Mentor
          </h2>
          <ul className="divide-y divide-gray-200">
            {studentData.map((student) => (
              <li
                key={student.id}
                className="py-3 flex justify-between items-center"
              >
                <p className="font-medium text-gray-700">
                  {student.name} (Roll No: {student.rollNo})
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 max-w-4xl mx-auto">
        <button
          className="w-full bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 font-semibold text-lg shadow-lg transition"
          onClick={handleAssignMentor}
        >
          Assign Mentor
        </button>
      </div>
    </div>
  );
};

export default AssignMentor;
