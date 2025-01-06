import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

const NoDuesManagement = () => {
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSem, setSelectedSem] = useState("");
  const [selectedCourses, setSelectedCourses] = useState({});
  const [selectedCoordinators, setSelectedCoordinators] = useState({});
  const [selectedMentors, setSelectedMentors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [filteredMentors, setFilteredMentors] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedSem) {
        console.log("Semester not selected yet.");
        return;
      }

      setIsLoading(true);
      try {
        const years = ["I", "II", "III", "IV"];
        const sections = ["A", "B", "C", "D", "E", "F"];

        // Fetch courses and students in parallel
        const coursePromises = [];
        const studentPromises = [];

        years.forEach((year) => {
          sections.forEach((section) => {
            const coursePath = `courses/${year}/${section}/sem${selectedSem}/courseDetails`;
            coursePromises.push(getDocs(collection(db, coursePath)));

            const studentsPath = `students/${year.toUpperCase()}/${section.toUpperCase()}`;
            studentPromises.push(getDocs(collection(db, studentsPath)));
          });
        });

        const [courseSnapshots, studentSnapshots] = await Promise.all([
          Promise.all(coursePromises),
          Promise.all(studentPromises),
        ]);

        // Process fetched data
        const fetchedCourses = courseSnapshots.flatMap((snapshot, index) => {
          const [year, section] = [
            years[Math.floor(index / sections.length)],
            sections[index % sections.length],
          ];
          return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            year,
            section,
            sem: selectedSem,
          }));
        });

        const fetchedStudents = studentSnapshots.flatMap((snapshot) =>
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );

        setCourses(fetchedCourses);
        setStudents(fetchedStudents);

        // Fetch faculty
        const facultySnapshot = await getDocs(collection(db, "faculty"));
        const fetchedFaculty = facultySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFaculty(fetchedFaculty);

        // Pre-select coordinators and mentors
        const defaultCoordinators = fetchedFaculty.reduce((acc, faculty) => {
          if (faculty.coordinator) acc[faculty.id] = true;
          return acc;
        }, {});

        const defaultMentors = fetchedFaculty.reduce((acc, faculty) => {
          if (fetchedStudents.some((student) => student.mentorId === faculty.id))
            acc[faculty.id] = true;
          return acc;
        }, {});

        setSelectedCoordinators(defaultCoordinators);
        setSelectedMentors(defaultMentors);

        // Add default HOD as admin if not exists
        const hodRef = doc(db, "admins", "HOD");
        const hodSnapshot = await getDocs(collection(db, "admins"));
        const isHodAdded = hodSnapshot.docs.some((doc) => doc.id === "HOD");

        if (!isHodAdded) {
          await setDoc(hodRef, {
            name: "HOD",
            role: "Admin",
            createdAt: new Date().toISOString(),
          });
          console.log("HOD added as admin.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedSem]);

  const handleFilter = () => {
    if (!selectedYear || !selectedSection || !selectedSem) {
      alert("Please select year, section, and semester.");
      return;
    }

    // Filter courses and mentors
    const filtered = courses.filter(
      (course) =>
        course.year === selectedYear &&
        course.section === selectedSection &&
        course.sem === selectedSem &&
        course.instructor
    );
    setFilteredCourses(filtered);

    const mentorsForSection = faculty.filter((mentor) =>
      students.some(
        (student) =>
          student.mentorId?.trim() === mentor.id?.trim() &&
          student.Section?.toUpperCase() === selectedSection.toUpperCase() &&
          student.Year?.toUpperCase() === selectedYear.toUpperCase()
      )
    );
    setFilteredMentors(mentorsForSection);
  };

  const handleGenerateNoDues = async (year, section, sem) => {
    if (!year || !section || !sem) {
      alert("Year, section, and semester are required to generate No Dues.");
      return;
    }
  
    setIsLoading(true);
    try {
      // Get the HOD
      const hod = faculty.find((fac) => fac.designation?.trim() === "Asst. Professor & Head");
      if (!hod) {
        alert("HOD not found. Please ensure HOD is listed in the faculty.");
        return;
      }
  
      const selectedCourseIds = Object.keys(selectedCourses).filter(
        (courseId) => selectedCourses[courseId]
      );
  
      const selectedCoordinatorIds = Object.keys(selectedCoordinators).filter(
        (coordinatorId) => selectedCoordinators[coordinatorId]
      );
  
      const selectedMentorIds = Object.keys(selectedMentors).filter(
        (mentorId) => selectedMentors[mentorId]
      );
  
      const linkedStudentsMap = new Map(); // Map to store student data
  
      // Process each selected course
      for (const courseId of selectedCourseIds) {
        const course = courses.find((course) => course.id === courseId);
        const courseStudents = course?.students || [];
  
        students
          .filter((student) => courseStudents.includes(student.id))
          .forEach((student) => {
            if (!linkedStudentsMap.has(student.id)) {
              linkedStudentsMap.set(student.id, {
                id: student.id,
                name: student.name || "Unknown",
                courses: [],
                courses_faculty: [],
                coordinators: selectedCoordinatorIds.map((id) => ({
                  id,
                  status: "Pending",
                })),
                mentors: selectedMentorIds.includes(student.mentorId)
                  ? [{ id: student.mentorId, status: "Pending" }]
                  : [], // Include selected mentors
                hod: { id: hod.id, name: hod.name, status: "Pending" }, // Assign HOD
                generatedAt: new Date().toISOString(),
                status: "Pending",
              });
            }
  
            const studentData = linkedStudentsMap.get(student.id);
            studentData.courses.push({ id: courseId, status: "Pending" });
            studentData.courses_faculty.push({
              courseId,
              facultyId: course.instructor || "Unknown",
              status: "Pending",
            });
          });
      }
  
      // Save linked students with HOD, coordinators, and mentors to Firestore
      const linkedStudents = Array.from(linkedStudentsMap.values());
      const noDuesRef = doc(db, `noDues/${year}/${section}/sem${sem}`);
      await setDoc(noDuesRef, {
        students: linkedStudents,
        generatedAt: new Date(),
        status: "Pending",
      });
  
      alert("No Dues generated successfully with Coordinators and Mentors!");
      setSelectedCourses({});
      setSelectedCoordinators({});
      setSelectedMentors({});
    } catch (error) {
      console.error("Error generating no dues:", error);
      alert("Failed to generate no dues.");
    } finally {
      setIsLoading(false);
    }
  };
  
  
  const handleCourseSelection = (courseId) => {
    setSelectedCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  const handleCoordinatorSelection = (coordinatorId) => {
    setSelectedCoordinators((prev) => ({
      ...prev,
      [coordinatorId]: !prev[coordinatorId],
    }));
  };

  const handleMentorSelection = (mentorId) => {
    setSelectedMentors((prev) => ({
      ...prev,
      [mentorId]: !prev[mentorId],
    }));
  };

  // Function to get HOD from faculty list
  const getHOD = () => {
    const hod = faculty.find((fac) => fac.designation?.trim() === "Asst. Professor & Head");
    if (!hod) {
      console.warn("HOD with designation 'Asst. Professor & Head' not found.");
      return { name: "N/A", id: "N/A" }; // Return default values if HOD is not found
    }
    return hod;
  };
  
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          No Dues Management
        </h1>
        {isLoading ? (
          <div className="flex justify-center items-center">
            <div className="loader border-t-4 border-blue-600 border-solid rounded-full w-12 h-12 animate-spin"></div>
            <p className="ml-4 text-lg text-gray-700">Processing...</p>
          </div>
        ) : (
          <>
            {/* Filter Section */}
            <div className="mb-6 bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Filter Courses
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Select Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  >
                    <option value="">-- Select Year --</option>
                    {["I", "II", "III", "IV"].map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Select Section
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  >
                    <option value="">-- Select Section --</option>
                    {["A", "B", "C", "D", "E", "F"].map((section) => (
                      <option key={section} value={section}>
                        {section}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Select Semester
                  </label>
                  <select
                    value={selectedSem}
                    onChange={(e) => setSelectedSem(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  >
                    <option value="">-- Select Semester --</option>
                    {["1", "2"].map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleFilter}
                    className="w-full bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition"
                  >
                    Filter
                  </button>
                </div>
              </div>
            </div>
            {/* Filtered Courses List */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Select Courses for No Dues
              </h2>
              {filteredCourses.length > 0 ? (
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="p-3 border border-gray-300">Select</th>
                      <th className="p-3 border border-gray-300">Course Name</th>
                      <th className="p-3 border border-gray-300">Faculty</th>
                      <th className="p-3 border border-gray-300">Year</th>
                      <th className="p-3 border border-gray-300">Section</th>
                      <th className="p-3 border border-gray-300">Semester</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map((course) => {
                      const instructor = faculty.find(
                        (fac) => fac.id === course.instructor
                      );
                      return (
                        <tr key={course.id} className="hover:bg-gray-100">
                          <td className="p-3 border border-gray-300 text-center">
                            <input
                              type="checkbox"
                              checked={selectedCourses[course.id] || false}
                              onChange={() => handleCourseSelection(course.id)}
                            />
                          </td>
                          <td className="p-3 border border-gray-300">{course.courseName}</td>
                          <td className="p-3 border border-gray-300">{instructor?.name || "N/A"}</td>
                          <td className="p-3 border border-gray-300">{course.year}</td>
                          <td className="p-3 border border-gray-300">{course.section}</td>
                          <td className="p-3 border border-gray-300">{course.sem}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-600 text-center">
                  No courses found for the selected year, section, and semester with an assigned instructor.
                </p>
              )}
            </div>
            {/* Coordinators Section */}
            <div className="bg-white shadow rounded-lg p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Select Coordinators for No Dues
              </h2>
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-3 border border-gray-300">Select</th>
                    <th className="p-3 border border-gray-300">Coordinator Name</th>
                    <th className="p-3 border border-gray-300">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {faculty
                    .filter((fac) => fac.coordinator)
                    .map((coordinator) => (
                      <tr key={coordinator.id} className="hover:bg-gray-100">
                        <td className="p-3 border border-gray-300 text-center">
                          <input
                            type="checkbox"
                            checked={selectedCoordinators[coordinator.id] || false}
                            onChange={() => handleCoordinatorSelection(coordinator.id)}
                          />
                        </td>
                        <td className="p-3 border border-gray-300">{coordinator.name}</td>
                        <td className="p-3 border border-gray-300">{coordinator.coordinator}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {/* Mentors Section */}
            <div className="bg-white shadow rounded-lg p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Select Mentors for No Dues
              </h2>
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-3 border border-gray-300">Select</th>
                    <th className="p-3 border border-gray-300">Mentor Name</th>
                    <th className="p-3 border border-gray-300">Assigned Students</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMentors.length > 0 ? (
                    filteredMentors.map((mentor) => {
                      const assignedStudents = students.filter(
                        (student) =>
                          student.mentorId === mentor.id &&
                          student.Section?.toUpperCase() === selectedSection.toUpperCase() &&
                          student.Year?.toUpperCase() === selectedYear.toUpperCase()
                      ).length;
                      return (
                        <tr key={mentor.id} className="hover:bg-gray-100">
                          <td className="p-3 border border-gray-300 text-center">
                            <input
                              type="checkbox"
                              checked={selectedMentors[mentor.id] || false}
                              onChange={() => handleMentorSelection(mentor.id)}
                            />
                          </td>
                          <td className="p-3 border border-gray-300">{mentor.name}</td>
                          <td className="p-3 border border-gray-300">{assignedStudents}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center p-3 text-gray-600">
                        No mentors found for the selected year and section.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-white shadow rounded-lg p-6 mt-6">
  <h2 className="text-xl font-semibold text-gray-700 mb-4">HOD Details</h2>
  {faculty.length > 0 ? (
    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-200">
          <th className="p-3 border border-gray-300 text-center">Select</th>
          <th className="p-3 border border-gray-300">HOD Name</th>
          <th className="p-3 border border-gray-300">Designation</th>
        </tr>
      </thead>
      <tbody>
        {faculty
          .filter((fac) => fac.designation?.trim() === "Asst. Professor & Head")
          .map((hod) => (
            <tr key={hod.id} className="hover:bg-gray-100">
              <td className="p-3 border border-gray-300 text-center">
                <input type="checkbox" className="w-5 h-5" checked disabled />
              </td>
              <td className="p-3 border border-gray-300">{hod.name}</td>
              <td className="p-3 border border-gray-300">{hod.designation}</td>
            </tr>
          ))}
      </tbody>
    </table>
  ) : (
    <p className="text-gray-700 text-center">No HOD data available.</p>
  )}
</div>


            {/* Generate No Dues Button */}
            <div className="text-center mt-6">
              <button
                onClick={() => handleGenerateNoDues(selectedYear, selectedSection, selectedSem)}
                className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition"
              >
                Generate No Dues
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NoDuesManagement;