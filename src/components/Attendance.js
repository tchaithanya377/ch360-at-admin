import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Import Firebase configuration
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';

const Attendance = ({ loggedInFaculty }) => {
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [studentAttendance, setStudentAttendance] = useState({});
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState(['A', 'B', 'C']); // Example sections
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch courses assigned to the faculty
  useEffect(() => {
    const fetchCourses = async () => {
      if (!loggedInFaculty) return;
      try {
        const coursesSnapshot = await getDocs(
          collection(db, `faculty/${loggedInFaculty.id}/courses`)
        );
        const coursesData = coursesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCourses(coursesData);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, [loggedInFaculty]);

  // Fetch students based on course and section
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedCourse || !selectedSection) return;

      try {
        const studentsSnapshot = await getDocs(
          collection(
            db,
            `courses/${selectedCourse}/sections/${selectedSection}/students`
          )
        );
        const studentsData = studentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStudents(studentsData);

        // Initialize attendance object
        const initialAttendance = {};
        studentsData.forEach((student) => {
          initialAttendance[student.id] = true; // Default to present
        });
        setStudentAttendance(initialAttendance);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchStudents();
  }, [selectedCourse, selectedSection]);

  // Save student attendance
  const handleSaveAttendance = async () => {
    try {
      const attendanceData = {
        date: new Date().toISOString().split('T')[0],
        facultyId: loggedInFaculty.id,
        courseId: selectedCourse,
        section: selectedSection,
        students: students.map((student) => ({
          id: student.id,
          name: student.name,
          present: studentAttendance[student.id],
        })),
      };

      await addDoc(collection(db, 'studentAttendance'), attendanceData);
      setSuccessMessage('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  };

  // Save faculty attendance during login
  useEffect(() => {
    const saveFacultyAttendance = async () => {
      if (!loggedInFaculty) return;

      try {
        const date = new Date().toISOString().split('T')[0];
        await setDoc(doc(db, 'facultyAttendance', `${loggedInFaculty.id}_${date}`), {
          date,
          facultyId: loggedInFaculty.id,
          loggedIn: true,
        });
      } catch (error) {
        console.error('Error saving faculty attendance:', error);
      }
    };

    saveFacultyAttendance();
  }, [loggedInFaculty]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Attendance</h1>

      {successMessage && <p className="text-green-500 mb-4">{successMessage}</p>}

      {/* Select Course */}
      <select
        value={selectedCourse}
        onChange={(e) => setSelectedCourse(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      >
        <option value="">Select Course</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.name}
          </option>
        ))}
      </select>

      {/* Select Section */}
      <select
        value={selectedSection}
        onChange={(e) => setSelectedSection(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      >
        <option value="">Select Section</option>
        {sections.map((section) => (
          <option key={section} value={section}>
            {section}
          </option>
        ))}
      </select>

      {/* Student Attendance */}
      <div>
        {students.map((student) => (
          <div key={student.id} className="flex items-center justify-between mb-2">
            <p>{student.name}</p>
            <input
              type="checkbox"
              checked={studentAttendance[student.id]}
              onChange={(e) =>
                setStudentAttendance((prev) => ({
                  ...prev,
                  [student.id]: e.target.checked,
                }))
              }
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSaveAttendance}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Save Attendance
      </button>
    </div>
  );
};

export default Attendance;
