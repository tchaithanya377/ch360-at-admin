import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Import Firebase configuration
import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const WeeklyTimetable = () => {
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const [timetable, setTimetable] = useState([]);
  const [courseMap, setCourseMap] = useState({});
  const [facultyMap, setFacultyMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [editEntry, setEditEntry] = useState(null); // For editing timetable entries

  const fetchTimetable = async () => {
    if (!year || !section) {
      alert('Please select both year and section.');
      return;
    }

    setLoading(true);

    try {
      const path = `/timetables/${year}/${section}`;
      const timetableSnapshot = await getDocs(collection(db, path));

      const timetableData = timetableSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log('Fetched Timetable:', timetableData);
      setTimetable(timetableData);

      const courseIds = new Set(timetableData.map((entry) => entry.courseId));
      const facultyIds = new Set(timetableData.map((entry) => entry.facultyId));

      // Fetch course details
      const fetchedCourses = await fetchCourseDetails(courseIds, year, section);

      // Fetch faculty details
      const fetchedFaculties = {};
      await Promise.all(
        [...facultyIds].map(async (facultyId) => {
          const facultyDoc = await getDoc(doc(db, 'faculty', facultyId));
          if (facultyDoc.exists()) {
            fetchedFaculties[facultyId] = facultyDoc.data().name;
          }
        })
      );

      console.log('Fetched Courses:', fetchedCourses);
      console.log('Fetched Faculties:', fetchedFaculties);

      setCourseMap(fetchedCourses);
      setFacultyMap(fetchedFaculties);
    } catch (error) {
      console.error('Error fetching timetable:', error.message);
      alert('Failed to fetch timetable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetails = async (courseIds, year, section) => {
    const fetchedCourses = {};

    await Promise.all(
      [...courseIds].map(async (courseId) => {
        const courseDoc = await getDoc(
          doc(
            db,
            `/courses/Computer Science & Engineering (Data Science)/years/${year}/sections/${section}/courseDetails`,
            courseId
          )
        );
        if (courseDoc.exists()) {
          fetchedCourses[courseId] = courseDoc.data().courseName;
        }
      })
    );

    return fetchedCourses;
  };

  const organizeTimetableByDays = () => {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timetableByDays = {};

    daysOfWeek.forEach((day) => {
      timetableByDays[day] = timetable.filter((entry) => entry.day.trim() === day);
    });

    return timetableByDays;
  };

  const organizedTimetable = organizeTimetableByDays();

  // Edit Timetable Entry
  const handleEdit = (entry) => {
    setEditEntry(entry); // Open form pre-filled with entry details
  };

  const handleDelete = async (entryId) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteDoc(doc(db, `/timetables/${year}/${section}`, entryId));
        setTimetable((prev) => prev.filter((entry) => entry.id !== entryId));
        alert('Entry deleted successfully.');
      } catch (error) {
        console.error('Error deleting entry:', error.message);
        alert('Failed to delete entry.');
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editEntry) return;

    try {
      const { id, ...updatedEntry } = editEntry;
      await updateDoc(doc(db, `/timetables/${year}/${section}`, id), updatedEntry);
      setTimetable((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, ...updatedEntry } : entry))
      );
      alert('Entry updated successfully.');
      setEditEntry(null); // Close the form
    } catch (error) {
      console.error('Error updating entry:', error.message);
      alert('Failed to update entry.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Weekly Timetable</h1>

      {/* Select Year and Section */}
      <div className="mb-4 grid grid-cols-2 gap-4">
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
      </div>

      {/* Fetch Button */}
      <button
        onClick={fetchTimetable}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-6"
      >
        Fetch Timetable
      </button>

      {/* Timetable Table */}
      {loading ? (
        <p>Loading timetable...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2">Day</th>
                {[...Array(7)].map((_, i) => (
                  <th key={i} className="border border-gray-300 px-4 py-2">{`Period ${i + 1}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(organizedTimetable).map(([day, entries]) => (
                <tr key={day}>
                  <td className="border border-gray-300 px-4 py-2 font-bold">{day}</td>
                  {[...Array(7)].map((_, periodIndex) => {
                    const entry = entries.find((e) =>
                      e.periods.some((p) => p === `${periodIndex + 1}st` || p === `${periodIndex + 1}nd` || p === `${periodIndex + 1}rd`)
                    );
                    return (
                      <td key={periodIndex} className="border border-gray-300 px-4 py-2 text-sm">
                        {entry ? (
                          <>
                            <p><strong>{courseMap[entry.courseId] || entry.courseId}</strong></p>
                            <p>{facultyMap[entry.facultyId] || entry.facultyId}</p>
                            <p>{entry.room}</p>
                            <p>{`${entry.startTime} - ${entry.endTime}`}</p>
                            <button
                              onClick={() => handleEdit(entry)}
                              className="text-blue-500 underline text-xs mr-2"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="text-red-500 underline text-xs"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <p>--</p>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Form */}
      {editEntry && (
        <form onSubmit={handleEditSubmit} className="mt-4">
          <h2 className="text-xl font-bold mb-4">Edit Entry</h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Room"
              value={editEntry.room}
              onChange={(e) =>
                setEditEntry((prev) => ({ ...prev, room: e.target.value }))
              }
              className="border p-2 rounded w-full"
            />
            <input
              type="time"
              placeholder="Start Time"
              value={editEntry.startTime}
              onChange={(e) =>
                setEditEntry((prev) => ({ ...prev, startTime: e.target.value }))
              }
              className="border p-2 rounded w-full"
            />
            <input
              type="time"
              placeholder="End Time"
              value={editEntry.endTime}
              onChange={(e) =>
                setEditEntry((prev) => ({ ...prev, endTime: e.target.value }))
              }
              className="border p-2 rounded w-full"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mt-4"
          >
            Save Changes
          </button>
        </form>
      )}
    </div>
  );
};

export default WeeklyTimetable;
