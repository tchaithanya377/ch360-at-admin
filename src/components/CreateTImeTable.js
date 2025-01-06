import React, { useState, useEffect } from "react";
import { db } from "../firebase"; // Import Firebase configuration
import { collection, getDocs, addDoc } from "firebase/firestore";

const Timetable = () => {
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [semester, setSemester] = useState(""); // State to manage semester selection
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState({});
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    day: "",
    courseId: "",
    facultyId: "",
    room: "",
    startTime: "",
    endTime: "",
    periods: [],
    combinedPeriods: false,
  });

  const periodsList = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Fetch data for the selected year, section, and semester
  useEffect(() => {
    const fetchData = async () => {
      if (year && section && semester) {
        try {
          // Fetch courses
          const coursesPath = `/courses/${year}/${section}/${semester}/courseDetails`;
          const courseSnapshot = await getDocs(collection(db, coursesPath));
          const coursesData = [];

          courseSnapshot.docs.forEach((doc) => {
            const course = doc.data();
            coursesData.push({
              id: doc.id,
              courseName: course.courseName,
              instructor: course.instructor || null,
            });
          });
          setCourses(coursesData);

          // Fetch faculty
          const facultySnapshot = await getDocs(collection(db, "faculty"));
          const facultyMap = {};

          facultySnapshot.docs.forEach((doc) => {
            const facultyData = doc.data();
            facultyMap[doc.id] = facultyData.name || "Unknown Faculty";
          });

          setFaculty(facultyMap);

          // Fetch students
          const studentsPath = `/students/${year}/${section}`;
          const studentSnapshot = await getDocs(collection(db, studentsPath));
          const studentsData = studentSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setStudents(studentsData);
        } catch (error) {
          console.error("Error fetching data:", error.message);
        }
      }
    };

    fetchData();
  }, [year, section, semester]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.periods.length) {
      alert("Please select at least one period.");
      return;
    }

    try {
      // Save timetable data to Firestore
      const timetableData = {
        ...formData,
        year,
        section,
        semester,
        studentIds: students.map((student) => student.id),
      };

      const timetablePath = `/timetables/${year}/${section}`;
      await addDoc(collection(db, timetablePath), timetableData);
      alert("Timetable added successfully!");

      // Reset form
      setFormData({
        day: "",
        courseId: "",
        facultyId: "",
        room: "",
        startTime: "",
        endTime: "",
        periods: [],
        combinedPeriods: false,
      });
    } catch (error) {
      console.error("Error adding timetable:", error.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Class Timetable</h1>

      {/* Select Year, Section, and Semester */}
      <div className="mb-4 grid grid-cols-3 gap-4">
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="">Select Year</option>
          <option value="I">I</option>
          <option value="II">II</option>
          <option value="III">III</option>
          <option value="IV">IV</option>
        </select>
        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="">Select Section</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>
        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="">Select Semester</option>
          <option value="sem1">Semester 1</option>
          <option value="sem2">Semester 2</option>
        </select>
      </div>

      {/* Timetable Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          <select
            value={formData.day}
            onChange={(e) => setFormData({ ...formData, day: e.target.value })}
            className="border p-2 rounded w-full"
            required
          >
            <option value="">Select Day</option>
            {daysOfWeek.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
          <input
            type="time"
            placeholder="Start Time"
            value={formData.startTime}
            onChange={(e) =>
              setFormData({ ...formData, startTime: e.target.value })
            }
            className="border p-2 rounded w-full"
            required
          />
          <input
            type="time"
            placeholder="End Time"
            value={formData.endTime}
            onChange={(e) =>
              setFormData({ ...formData, endTime: e.target.value })
            }
            className="border p-2 rounded w-full"
            required
          />
          <select
            value={formData.courseId}
            onChange={(e) =>
              setFormData({ ...formData, courseId: e.target.value })
            }
            className="border p-2 rounded w-full"
            required
          >
            <option value="">Select Course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.courseName}
              </option>
            ))}
          </select>
          <select
            value={formData.facultyId}
            onChange={(e) =>
              setFormData({ ...formData, facultyId: e.target.value })
            }
            className="border p-2 rounded w-full"
            required
          >
            <option value="">Select Faculty</option>
            {Object.entries(faculty).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Room (e.g., Lab 6)"
            value={formData.room}
            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
            className="border p-2 rounded w-full"
            required
          />
        </div>

        {/* Period Selection */}
        <div className="mt-4">
          <label className="block font-bold mb-2">Select Period(s):</label>
          <div className="grid grid-cols-4 gap-2">
            {periodsList.map((period) => (
              <label key={period} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={period}
                  checked={formData.periods.includes(period)}
                  onChange={(e) => {
                    const selectedPeriods = formData.periods.includes(period)
                      ? formData.periods.filter((p) => p !== period)
                      : [...formData.periods, period];
                    setFormData({ ...formData, periods: selectedPeriods });
                  }}
                />
                <span>{period}</span>
              </label>
            ))}
          </div>
          <div className="mt-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.combinedPeriods}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    combinedPeriods: e.target.checked,
                  })
                }
              />
              <span>Combine Periods</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Timetable
        </button>
      </form>
    </div>
  );
};

export default Timetable;
