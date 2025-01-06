import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";

function Relationships() {
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSem, setSelectedSem] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Data Based on Year, Section, and Semester
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedYear || !selectedSection || !selectedSem) {
        console.log("Year, Section, or Semester not selected yet.");
        return;
      }

      setIsLoading(true);

      try {
        const normalizedSection = selectedSection.toUpperCase();

        // Fetch students
        const studentsSnapshot = await getDocs(
          collection(db, `students/${selectedYear}/${normalizedSection}`)
        );
        const studentsData = studentsSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            // Sort by rollNo
            if (a.rollNo && b.rollNo) {
              return a.rollNo.localeCompare(b.rollNo);
            }
            return 0;
          });
        setStudents(studentsData);

        // Fetch faculty
        const facultySnapshot = await getDocs(collection(db, "faculty"));
        const facultyData = facultySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFaculty(facultyData);

        // Fetch courses
        const coursesSnapshot = await getDocs(
          collection(
            db,
            `courses/${selectedYear}/${normalizedSection}/sem${selectedSem}/courseDetails`
          )
        );
        const coursesData = coursesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCourses(coursesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [selectedYear, selectedSection, selectedSem]);

  // Handle selecting or deselecting individual students
  const handleStudentSelection = (studentId) => {
    setSelectedStudents((prevSelected) =>
      prevSelected.includes(studentId)
        ? prevSelected.filter((id) => id !== studentId) // Deselect if already selected
        : [...prevSelected, studentId] // Select if not already selected
    );
  };

  // Handle "Select All" or "Deselect All"
  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      // If all are selected, deselect all
      setSelectedStudents([]);
    } else {
      // Otherwise, select all
      setSelectedStudents(students.map((student) => student.id));
    }
  };

  const assignRelationships = async () => {
    if (!selectedYear || !selectedSection || !selectedSem || !selectedCourse || !selectedFaculty || selectedStudents.length === 0) {
      alert("Please select year, section, semester, course, faculty, and at least one student.");
      return;
    }

    setIsLoading(true);

    try {
      const batch = writeBatch(db);

      // Update only selected students
      selectedStudents.forEach((studentId) => {
        const studentRef = doc(
          db,
          `students/${selectedYear}/${selectedSection}/${studentId}`
        );
        const student = students.find((s) => s.id === studentId);
        if (student) {
          const updatedCourses = student.courses
            ? [...new Set([...student.courses, selectedCourse])]
            : [selectedCourse];
          batch.update(studentRef, { courses: updatedCourses });
        }
      });

      // Update the faculty with the assigned course
      const facultyRef = doc(db, `faculty/${selectedFaculty}`);
      const facultyDoc = faculty.find((fac) => fac.id === selectedFaculty);
      if (facultyDoc) {
        const updatedFacultyCourses = facultyDoc.courses
          ? [...new Set([...facultyDoc.courses, selectedCourse])]
          : [selectedCourse];
        batch.update(facultyRef, { courses: updatedFacultyCourses });
      }

      // Update the course with the selected students
      const courseRef = doc(
        db,
        `courses/${selectedYear}/${selectedSection}/sem${selectedSem}/courseDetails/${selectedCourse}`
      );
      batch.update(courseRef, {
        instructor: selectedFaculty,
        students: selectedStudents,
      });

      await batch.commit();
      alert("Relationships successfully assigned for selected students!");
    } catch (error) {
      console.error("Error assigning relationships:", error);
      alert("An error occurred while assigning relationships.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
          Assign Faculty to Course and Students
        </h1>

        {isLoading ? (
          <div className="flex justify-center items-center">
            <div className="loader border-t-4 border-blue-600 border-solid rounded-full w-12 h-12 animate-spin"></div>
            <p className="ml-4 text-lg text-gray-700">Loading...</p>
          </div>
        ) : (
          <div className="space-y-4 bg-white shadow-lg rounded-lg p-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Select Year</h2>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md"
              >
                <option value="">-- Select a Year --</option>
                <option value="IV">IV</option>
                <option value="III">III</option>
                <option value="II">II</option>
              </select>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Select Section</h2>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md"
              >
                <option value="">-- Select a Section --</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
                <option value="F">F</option>
              </select>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Select Semester</h2>
              <select
                value={selectedSem}
                onChange={(e) => setSelectedSem(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md"
              >
                <option value="">-- Select a Semester --</option>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>

            {students.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                  Select Students
                </h2>
                <button
                  onClick={handleSelectAll}
                  className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  {selectedStudents.length === students.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                <div className="space-y-2">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={student.id}
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentSelection(student.id)}
                      />
                      <label htmlFor={student.id}>
                        {student.rollNo
                          ? `${student.rollNo} - ${student.name || `Student ${student.id}`}`
                          : `Student ID: ${student.id}`}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Select Course</h2>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md"
                disabled={courses.length === 0}
              >
                <option value="">-- Select a Course --</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.courseCode} - {course.courseName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Select Faculty</h2>
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md"
                disabled={faculty.length === 0}
              >
                <option value="">-- Select Faculty --</option>
                {faculty.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} ({fac.designation})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={assignRelationships}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition duration-200"
            >
              Assign Relationships
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Relationships;