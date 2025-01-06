import React, { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase"; // Your Firebase configuration

const NoDuesPage = () => {
  const [academicYear, setAcademicYear] = useState("");
  const [section, setSection] = useState("");
  const [semester, setSemester] = useState("");
  const [data, setData] = useState([]);
  const [facultyMap, setFacultyMap] = useState({});
  const [courseMap, setCourseMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const academicYears = ["I", "II", "III", "IV"];
  const sections = ["A", "B", "C", "D", "E", "F"];
  const semesters = ["sem1", "sem2"];

  // Fetch faculty data
  const fetchFacultyData = async () => {
    try {
      const facultySnapshot = await getDocs(collection(db, "faculty"));
      const faculty = {};
      facultySnapshot.forEach((doc) => {
        faculty[doc.id] = doc.data().name || "Unknown Faculty";
      });
      setFacultyMap(faculty);
    } catch (err) {
      console.error("Error fetching faculty data:", err);
    }
  };

  // Fetch course details
  const fetchCourseData = async (academicYear, section, semester) => {
    try {
      const coursePath = `courses/${academicYear}/${section}/${semester}/courseDetails`;
      const courseSnapshot = await getDocs(collection(db, coursePath));
      const courses = {};
      courseSnapshot.forEach((doc) => {
        const courseData = doc.data();
        courses[doc.id] = {
          courseName: courseData.courseName || "Unknown Course",
          facultyId: courseData.instructor || "Unknown Faculty",
        };
      });
      setCourseMap(courses);
    } catch (err) {
      console.error("Error fetching course data:", err);
    }
  };

  // Fetch student roll numbers and enrich data
  const fetchStudentData = async (academicYear, section, students) => {
    const enrichedData = await Promise.all(
      students.map(async (student) => {
        try {
          const studentDoc = doc(db, `students/${academicYear}/${section}/${student.id}`);
          const studentSnap = await getDoc(studentDoc);
          if (studentSnap.exists()) {
            const studentData = studentSnap.data();
            return { ...student, rollNo: studentData.rollNo || "N/A" };
          }
        } catch (err) {
          console.error("Error fetching student data:", err);
        }
        return { ...student, rollNo: "N/A" }; // Fallback in case of error
      })
    );
    return enrichedData;
  };

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const fetchData = async () => {
    if (!academicYear || !section || !semester) {
      setError("Please select academic year, section, and semester.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await fetchCourseData(academicYear, section, semester);

      // Query to fetch the noDues document
      const noDuesDocRef = doc(db, `noDues/${academicYear}/${section}/${semester}`);
      const noDuesDocSnap = await getDoc(noDuesDocRef);

      if (!noDuesDocSnap.exists()) {
        setError("No data found for the selected year, section, and semester.");
        setData([]);
        setIsLoading(false);
        return;
      }

      const documentData = noDuesDocSnap.data();

      let enrichedData = await fetchStudentData(academicYear, section, documentData.students || []);
      enrichedData = enrichedData.sort((a, b) => {
        if (sortOrder === "asc") {
          return a.rollNo.localeCompare(b.rollNo);
        } else {
          return b.rollNo.localeCompare(a.rollNo);
        }
      });
      setData(enrichedData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Please try again.");
    }

    setIsLoading(false);
  };

  const handleFetchClick = () => {
    fetchData();
  };

  const handleSortClick = () => {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
    setData((prevData) =>
      [...prevData].sort((a, b) => {
        if (sortOrder === "asc") {
          return b.rollNo.localeCompare(a.rollNo);
        } else {
          return a.rollNo.localeCompare(b.rollNo);
        }
      })
    );
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "bg-green-200 text-green-800";
      case "pending":
        return "bg-yellow-200 text-yellow-800";
      case "rejected":
        return "bg-red-200 text-red-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const getNameById = (id, map) => map[id] || "N/A";

  const filteredData = data.filter((student) => {
    const matchesSearch =
      !searchTerm || student.rollNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      !filterStatus || student.status?.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 flex flex-col items-center py-10">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-7xl">
        <h1 className="text-4xl font-extrabold text-gray-800 text-center mb-8">
          No Dues Data
        </h1>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-gray-700 font-medium mb-2">
                Academic Year:
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Year</option>
                {academicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 font-medium mb-2">
                Section:
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Section</option>
                {sections.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 font-medium mb-2">
                Semester:
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Semester</option>
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleFetchClick}
            disabled={isLoading}
            className={`w-full p-3 rounded-md text-white font-semibold ${
              isLoading
                ? "bg-purple-300 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {isLoading ? "Fetching..." : "Fetch Data"}
          </button>
        </div>

        {error && (
          <p className="text-red-600 text-center mt-4 text-lg">{error}</p>
        )}

        {data.length > 0 && (
          <div className="mt-8 overflow-x-auto">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by roll number"
                className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <select
                value={filterStatus}
                onChange={handleFilterChange}
                className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Filter by status</option>
                <option value="accepted">Accepted</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Data for Academic Year: {academicYear}, Section: {section}, Semester: {semester}
            </h2>
            <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
              <thead>
                <tr className="bg-purple-500 text-white text-left">
                  <th className="py-4 px-6 cursor-pointer" onClick={handleSortClick}>
                    Roll No {sortOrder === "asc" ? "↑" : "↓"}
                  </th>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Coordinators</th>
                  <th className="py-4 px-6">Courses</th>
                  <th className="py-4 px-6">Courses Faculty</th>
                  <th className="py-4 px-6">Mentors</th>
                  <th className="py-4 px-6">HOD</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((student, index) => (
                  <tr
                    key={index}
                    className={`border-b ${
                      index % 2 === 0 ? "bg-gray-100" : "bg-white"
                    }`}
                  >
                    <td className="py-3 px-6">{student.rollNo || "N/A"}</td>
                    <td className="py-3 px-6">{student.name || "N/A"}</td>
                    <td className="py-3 px-6">
                      {student.coordinators?.map((coordinator, idx) => (
                        <p key={idx}>
                          {getNameById(coordinator.id, facultyMap)} -{" "}
                          <span
                            className={`inline-block px-2 py-1 rounded-full ${getStatusColor(
                              coordinator.status
                            )}`}
                          >
                            {coordinator.status}
                          </span>
                        </p>
                      ))}
                    </td>
                    <td className="py-3 px-6">
                      {student.courses?.map((course, idx) => (
                        <p key={idx}>
                          {courseMap[course.id]?.courseName} -{" "}
                        </p>
                      ))}
                    </td>
                    <td className="py-3 px-6">
                      {student.courses_faculty?.map((courseFaculty, idx) => (
                        <p key={idx}>
                          {facultyMap[courseFaculty.facultyId] || "Unknown Faculty"} -{" "}
                          <span
                            className={`inline-block px-2 py-1 rounded-full ${getStatusColor(
                              courseFaculty.status
                            )}`}
                          >
                            {courseFaculty.status}
                          </span>
                        </p>
                      ))}
                    </td>
                    <td className="py-3 px-6">
                      {student.mentors?.map((mentor, idx) => (
                        <p key={idx}>
                          {getNameById(mentor.id, facultyMap)} -{" "}
                          <span
                            className={`inline-block px-2 py-1 rounded-full ${getStatusColor(
                              mentor.status
                            )}`}
                          >
                            {mentor.status}
                          </span>
                        </p>
                      ))}
                    </td>
                    <td className="py-3 px-6">
                      {student.hod && (
                        <p>
                          {getNameById(student.hod.id, facultyMap)} -{" "}
                          <span
                            className={`inline-block px-2 py-1 rounded-full ${getStatusColor(
                              student.hod.status
                            )}`}
                          >
                            {student.hod.status}
                          </span>
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoDuesPage;