import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

function FacultyAssignments() {
  const [facultyAssignments, setFacultyAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchFacultyAssignments = async () => {
      setLoading(true);
      try {
        const facultySnapshot = await getDocs(collection(db, "faculty"));
        const facultyList = facultySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const assignments = [];
        const years = ["I", "II", "III", "IV"];
        const sections = ["A", "B", "C", "D", "E", "F"];
        const semesters = ["sem1", "sem2"];

        for (const year of years) {
          for (const section of sections) {
            for (const semester of semesters) {
              for (const faculty of facultyList) {
                const assignedCourses = faculty.courses || [];
                for (const courseId of assignedCourses) {
                  try {
                    const courseDoc = await getDoc(
                      doc(
                        db,
                        `courses/${year}/${section}/${semester}/courseDetails/${courseId}`
                      )
                    );

                    if (courseDoc.exists()) {
                      const courseData = courseDoc.data();
                      assignments.push({
                        id: courseId, // Unique ID
                        facultyId: faculty.id,
                        facultyName: faculty.name,
                        facultyDesignation: faculty.designation,
                        year,
                        section,
                        semester,
                        courseCode: courseData.courseCode,
                        courseName: courseData.courseName,
                      });
                    }
                  } catch (err) {
                    console.warn(`Error fetching course: ${courseId} for year ${year}, section ${section}, semester ${semester}`, err);
                  }
                }
              }
            }
          }
        }

        setFacultyAssignments(assignments);
        setFilteredAssignments(assignments);
      } catch (error) {
        console.error("Error fetching faculty assignments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyAssignments();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    filterAssignments(term, selectedYear, selectedSection, selectedSemester);
  };

  const handleYearFilter = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    filterAssignments(searchTerm, year, selectedSection, selectedSemester);
  };

  const handleSectionFilter = (e) => {
    const section = e.target.value;
    setSelectedSection(section);
    filterAssignments(searchTerm, selectedYear, section, selectedSemester);
  };

  const handleSemesterFilter = (e) => {
    const semester = e.target.value;
    setSelectedSemester(semester);
    filterAssignments(searchTerm, selectedYear, selectedSection, semester);
  };

  const filterAssignments = (term, year, section, semester) => {
    const filtered = facultyAssignments.filter((assignment) => {
      const matchesSearch =
        assignment.facultyName.toLowerCase().includes(term) ||
        assignment.facultyDesignation.toLowerCase().includes(term);
      const matchesYear = year ? assignment.year === year : true;
      const matchesSection = section ? assignment.section === section : true;
      const matchesSemester = semester ? assignment.semester === semester : true;
      return matchesSearch && matchesYear && matchesSection && matchesSemester;
    });
    setFilteredAssignments(filtered);
  };

  const handleViewEdit = (assignment) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleDelete = async (assignment) => {
    if (window.confirm("Are you sure you want to delete this relationship?")) {
      try {
        // Step 1: Remove the course from the faculty's assigned courses
        const facultyRef = doc(db, `faculty/${assignment.facultyId}`);
        const facultyDoc = await getDoc(facultyRef);
        if (facultyDoc.exists()) {
          const facultyData = facultyDoc.data();
          const updatedCourses = facultyData.courses.filter((courseId) => courseId !== assignment.id);
          await updateDoc(facultyRef, { courses: updatedCourses });
        }

        // Step 2: Remove the course from all students in the specified year and section
        const studentsSnapshot = await getDocs(
          collection(
            db,
            `students/years/${assignment.year}/sections/${assignment.section}`
          )
        );
        for (const studentDoc of studentsSnapshot.docs) {
          const studentData = studentDoc.data();
          const updatedStudentCourses = (studentData.courses || []).filter(
            (courseId) => courseId !== assignment.id
          );
          const studentRef = doc(
            db,
            `students/years/${assignment.year}/sections/${assignment.section}/${studentDoc.id}`
          );
          await updateDoc(studentRef, { courses: updatedStudentCourses });
        }

        // Step 3: Reset the instructor and students relationship in the course document
        const courseRef = doc(
          db,
          `courses/${assignment.year}/${assignment.section}/${assignment.semester}/courseDetails/${assignment.id}`
        );
        await updateDoc(courseRef, {
          instructor: null, // Remove the instructor
          students: [], // Clear the list of students
        });

        // Step 4: Update the local state
        setFacultyAssignments((prev) => prev.filter((item) => item.id !== assignment.id));
        setFilteredAssignments((prev) => prev.filter((item) => item.id !== assignment.id));
        alert("Relationship deleted successfully!");
      } catch (error) {
        console.error("Error deleting relationship:", error);
        alert("An error occurred while deleting the relationship.");
      }
    }
  };

  const handleSave = async () => {
    try {
      if (selectedAssignment) {
        const courseRef = doc(
          db,
          `courses/${selectedAssignment.year}/${selectedAssignment.section}/${selectedAssignment.semester}/courseDetails/${selectedAssignment.id}`
        );
        await updateDoc(courseRef, {
          courseName: selectedAssignment.courseName,
          courseCode: selectedAssignment.courseCode,
        });
        alert("Assignment updated successfully!");
      }
    } catch (error) {
      console.error("Error updating assignment:", error);
      alert("An error occurred while updating the assignment.");
    }
    setIsModalOpen(false);
  };

  if (loading) {
    return <div className="text-center p-6">Loading assignments...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
          Faculty Assigned Courses
        </h1>

        {/* Filters Section */}
        <div className="flex flex-wrap justify-between items-center bg-white shadow-md p-4 rounded-lg mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search by faculty name or designation"
            className="w-full md:w-1/4 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={selectedYear}
            onChange={handleYearFilter}
            className="w-full md:w-1/4 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4 md:mt-0"
          >
            <option value="">All Years</option>
            <option value="I">I</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
          </select>

          <select
            value={selectedSection}
            onChange={handleSectionFilter}
            className="w-full md:w-1/4 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4 md:mt-0"
          >
            <option value="">All Sections</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
            <option value="F">F</option>
          </select>

          <select
            value={selectedSemester}
            onChange={handleSemesterFilter}
            className="w-full md:w-1/4 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4 md:mt-0"
          >
            <option value="">All Semesters</option>
            <option value="sem1">Semester 1</option>
            <option value="sem2">Semester 2</option>
          </select>
        </div>

        {/* Faculty Assignments */}
        {filteredAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map((assignment, index) => (
              <div
                key={index}
                className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-200"
              >
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                  {assignment.facultyName}
                </h2>
                <p className="text-gray-600">
                  <strong>Designation:</strong> {assignment.facultyDesignation}
                </p>
                <p className="text-gray-600">
                  <strong>Year:</strong> {assignment.year}
                </p>
                <p className="text-gray-600">
                  <strong>Section:</strong> {assignment.section}
                </p>
                <p className="text-gray-600">
                  <strong>Semester:</strong> {assignment.semester === "sem1" ? "Semester 1" : "Semester 2"}
                </p>
                <p className="text-gray-600">
                  <strong>Course Code:</strong> {assignment.courseCode}
                </p>
                <p className="text-gray-600">
                  <strong>Course Name:</strong> {assignment.courseName}
                </p>
                <div className="mt-4">
                  <button
                    className="bg-blue-500 text-white py-2 px-4 rounded-md mr-2"
                    onClick={() => handleViewEdit(assignment)}
                  >
                    View/Edit
                  </button>
                  <button
                    className="bg-red-500 text-white py-2 px-4 rounded-md"
                    onClick={() => handleDelete(assignment)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 mt-6">
            No faculty assignments found. Please adjust your filters or add data
            to Firestore.
          </p>
        )}
      </div>

      {/* Modal for View/Edit */}
      {isModalOpen && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-2xl font-semibold mb-4">View/Edit Assignment</h2>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Course Code</label>
              <input
                type="text"
                value={selectedAssignment.courseCode}
                onChange={(e) =>
                  setSelectedAssignment({ ...selectedAssignment, courseCode: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Course Name</label>
              <input
                type="text"
                value={selectedAssignment.courseName}
                onChange={(e) =>
                  setSelectedAssignment({ ...selectedAssignment, courseName: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex justify-end">
              <button
                className="bg-gray-500 text-white py-2 px-4 rounded-md mr-2"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white py-2 px-4 rounded-md"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultyAssignments;
