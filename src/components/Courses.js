import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

function Courses() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [instructors, setInstructors] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ year: "All", section: "All", semester: "All" });
  const [isViewing, setIsViewing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch Courses and Instructors
  useEffect(() => {
    const fetchCoursesAndInstructors = async () => {
      setLoading(true);
      try {
        const years = ["I", "II", "III", "IV"];
        const sections = ["A", "B", "C", "D", "E", "F"];
        const semesters = ["sem1", "sem2"];
        let allCourses = [];

        for (const year of years) {
          for (const section of sections) {
            for (const semester of semesters) {
              const querySnapshot = await getDocs(
                collection(db, `courses/${year}/${section}/${semester}/courseDetails`)
              );
              const sectionCourses = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                year,
                section,
                semester,
                ...doc.data(),
              }));
              allCourses = [...allCourses, ...sectionCourses];
            }
          }
        }

        // Fetch instructor names
        const instructorIds = [...new Set(allCourses.map((c) => c.instructor))];
        const instructorData = {};
        for (const id of instructorIds) {
          if (id) {
            const instructorSnapshot = await getDoc(doc(db, "faculty", id));
            instructorData[id] = instructorSnapshot.exists()
              ? instructorSnapshot.data().name
              : "Unknown";
          }
        }

        setCourses(allCourses);
        setFilteredCourses(allCourses);
        setInstructors(instructorData);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
      setLoading(false);
    };

    fetchCoursesAndInstructors();
  }, []);

  // Filtering Logic
  useEffect(() => {
    let filtered = courses;
    if (filters.year !== "All") filtered = filtered.filter((c) => c.year === filters.year);
    if (filters.section !== "All") filtered = filtered.filter((c) => c.section === filters.section);
    if (filters.semester !== "All")
      filtered = filtered.filter((c) => c.semester === filters.semester);
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (c) =>
          c.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredCourses(filtered);
  }, [searchQuery, filters, courses]);

  // Delete Course
  const handleDeleteCourse = async (course) => {
    if (window.confirm(`Are you sure you want to delete "${course.courseName}"?`)) {
      try {
        setLoading(true);
        const coursePath = `courses/${course.year}/${course.section}/${course.semester}/courseDetails/${course.id}`;
        await deleteDoc(doc(db, coursePath));

        setCourses((prevCourses) => prevCourses.filter((c) => c.id !== course.id));
        setFilteredCourses((prevCourses) => prevCourses.filter((c) => c.id !== course.id));
        alert("Course deleted successfully!");
      } catch (error) {
        console.error("Error deleting course:", error);
        alert("Failed to delete the course. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Save Edited Course
  const handleSaveEdit = async (course) => {
    try {
      const coursePath = `courses/${selectedCourse.year}/${selectedCourse.section}/${selectedCourse.semester}/courseDetails/${selectedCourse.id}`;
      await updateDoc(doc(db, coursePath), selectedCourse);

      setCourses((prevCourses) =>
        prevCourses.map((c) => (c.id === selectedCourse.id ? selectedCourse : c))
      );
      setFilteredCourses((prevCourses) =>
        prevCourses.map((c) => (c.id === selectedCourse.id ? selectedCourse : c))
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("Failed to update the course.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Course Details</h1>

      {/* Search and Filter */}
      <div className="flex flex-wrap gap-4 mb-6 justify-center">
        <input
          type="text"
          placeholder="Search by Course Name or Code"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border rounded-md w-full md:w-1/3"
        />
        <select
          onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          className="p-2 border rounded-md"
        >
          <option value="All">All Years</option>
          <option value="I">I</option>
          <option value="II">II</option>
          <option value="III">III</option>
          <option value="IV">IV</option>
        </select>
        <select
          onChange={(e) => setFilters({ ...filters, section: e.target.value })}
          className="p-2 border rounded-md"
        >
          <option value="All">All Sections</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
        <select
          onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
          className="p-2 border rounded-md"
        >
          <option value="All">All Semesters</option>
          <option value="sem1">Semester 1</option>
          <option value="sem2">Semester 2</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && <p className="text-center text-lg">Loading...</p>}

      {/* Course List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-2">{course.courseCode || "N/A"}</h2>
            <p><strong>Course Name:</strong> {course.courseName || "N/A"}</p>
            <p><strong>Year:</strong> {course.year || "N/A"}</p>
            <p><strong>Section:</strong> {course.section || "N/A"}</p>
            <p><strong>Semester:</strong> {course.semester || "N/A"}</p>
            <p><strong>Instructor:</strong> {instructors[course.instructor] || "N/A"}</p>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => {
                  setSelectedCourse(course);
                  setIsViewing(true);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                View
              </button>
              <button
                onClick={() => {
                  setSelectedCourse(course);
                  setIsEditing(true);
                }}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteCourse(course)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {isViewing && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
            <h2 className="text-2xl font-bold mb-4">View Course</h2>
            <p><strong>Course Code:</strong> {selectedCourse.courseCode}</p>
            <p><strong>Course Name:</strong> {selectedCourse.courseName}</p>
            <p><strong>Year:</strong> {selectedCourse.year}</p>
            <p><strong>Section:</strong> {selectedCourse.section}</p>
            <p><strong>Semester:</strong> {selectedCourse.semester}</p>
            <p><strong>Instructor:</strong> {instructors[selectedCourse.instructor]}</p>
            <button
              onClick={() => setIsViewing(false)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

{isEditing && selectedCourse && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="relative bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
      {/* Close Icon */}
      <button
        onClick={() => setIsEditing(false)}
        className="absolute top-2 right-3 text-gray-600 hover:text-gray-800 text-2xl font-bold"
      >
        &times;
      </button>

      {/* Modal Header */}
      <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">Edit Course</h2>

      {/* Modal Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          value={selectedCourse.courseCode}
          onChange={(e) => setSelectedCourse({ ...selectedCourse, courseCode: e.target.value })}
          className="p-2 border rounded-md w-full"
          placeholder="Course Code"
        />
        <input
          type="text"
          value={selectedCourse.courseName}
          onChange={(e) => setSelectedCourse({ ...selectedCourse, courseName: e.target.value })}
          className="p-2 border rounded-md w-full"
          placeholder="Course Name"
        />
        <input
          type="text"
          value={selectedCourse.actualHours}
          onChange={(e) => setSelectedCourse({ ...selectedCourse, actualHours: e.target.value })}
          className="p-2 border rounded-md w-full"
          placeholder="Actual Hours"
        />
        <input
          type="text"
          value={selectedCourse.cls}
          onChange={(e) => setSelectedCourse({ ...selectedCourse, cls: e.target.value })}
          className="p-2 border rounded-md w-full"
          placeholder="Class"
        />
        <input
          type="text"
          value={selectedCourse.coveragePercentage}
          onChange={(e) =>
            setSelectedCourse({ ...selectedCourse, coveragePercentage: e.target.value })
          }
          className="p-2 border rounded-md w-full"
          placeholder="Coverage Percentage"
        />
        <input
          type="text"
          value={selectedCourse.deviationReasons}
          onChange={(e) =>
            setSelectedCourse({ ...selectedCourse, deviationReasons: e.target.value })
          }
          className="p-2 border rounded-md w-full"
          placeholder="Deviation Reasons"
        />
        <input
          type="text"
          value={selectedCourse.instructor}
          onChange={(e) => setSelectedCourse({ ...selectedCourse, instructor: e.target.value })}
          className="p-2 border rounded-md w-full"
          placeholder="Instructor"
        />
        <input
          type="text"
          value={selectedCourse.leavesAvailed}
          onChange={(e) => setSelectedCourse({ ...selectedCourse, leavesAvailed: e.target.value })}
          className="p-2 border rounded-md w-full"
          placeholder="Leaves Availed"
        />
        <input
          type="text"
          value={selectedCourse.ods}
          onChange={(e) => setSelectedCourse({ ...selectedCourse, ods: e.target.value })}
          className="p-2 border rounded-md w-full"
          placeholder="ODs"
        />
        <input
          type="text"
          value={selectedCourse.permissions}
          onChange={(e) => setSelectedCourse({ ...selectedCourse, permissions: e.target.value })}
          className="p-2 border rounded-md w-full"
          placeholder="Permissions"
        />
        <input
          type="text"
          value={selectedCourse.syllabusCoverage}
          onChange={(e) =>
            setSelectedCourse({ ...selectedCourse, syllabusCoverage: e.target.value })
          }
          className="p-2 border rounded-md w-full"
          placeholder="Syllabus Coverage"
        />
        <input
          type="text"
          value={selectedCourse.unitsCompleted}
          onChange={(e) =>
            setSelectedCourse({ ...selectedCourse, unitsCompleted: e.target.value })
          }
          className="p-2 border rounded-md w-full"
          placeholder="Units Completed"
        />
      </div>

      {/* Modal Footer */}
      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={() => handleSaveEdit(selectedCourse)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Save
        </button>
        <button
          onClick={() => setIsEditing(false)}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default Courses;