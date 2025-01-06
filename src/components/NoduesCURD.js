import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ManageCoursesAndRoles = () => {
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [courses, setCourses] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [newEntry, setNewEntry] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("courses");

  // Fetch data based on the selected role, year, and section
  const fetchData = async () => {
    if (!year || !section) {
      toast.error("Please select a year and section!");
      return;
    }

    setLoading(true);
    try {
      const collectionRef = collection(
        db,
        `${selectedRole}/${year}/${section}`
      );
      const dataQuery = query(collectionRef);
      const snapshot = await getDocs(dataQuery);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      switch (selectedRole) {
        case "courses":
          setCourses(data);
          break;
        case "coordinators":
          setCoordinators(data);
          break;
        case "mentors":
          setMentors(data);
          break;
        default:
          break;
      }
    } catch (error) {
      toast.error("Failed to fetch data. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new entry
  const addEntry = async () => {
    if (!year || !section || !newEntry) {
      toast.error("All fields are required!");
      return;
    }

    try {
      const collectionRef = collection(
        db,
        `${selectedRole}/${year}/${section}`
      );
      await addDoc(collectionRef, { name: newEntry });
      toast.success(`${selectedRole.slice(0, -1)} added successfully!`);
      fetchData();
    } catch (error) {
      toast.error("Failed to add entry. Please try again.");
      console.error(error);
    } finally {
      setNewEntry("");
    }
  };

  // Update an entry
  const updateEntry = async (id, updatedName) => {
    try {
      const docRef = doc(db, `${selectedRole}/${year}/${section}`, id);
      await updateDoc(docRef, { name: updatedName });
      toast.success(`${selectedRole.slice(0, -1)} updated successfully!`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update entry. Please try again.");
      console.error(error);
    }
  };

  // Delete an entry
  const deleteEntry = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this entry?"
    );
    if (!confirmDelete) return;

    try {
      const docRef = doc(db, `${selectedRole}/${year}/${section}`, id);
      await deleteDoc(docRef);
      toast.success(`${selectedRole.slice(0, -1)} deleted successfully!`);
      fetchData();
    } catch (error) {
      toast.error("Failed to delete entry. Please try again.");
      console.error(error);
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <ToastContainer />
      <div className="bg-white shadow rounded-lg p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Manage Courses, Coordinators, and Mentors
        </h1>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <select
            className="w-full border px-4 py-2 rounded-md"
            onChange={(e) => setYear(e.target.value)}
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
            className="w-full border px-4 py-2 rounded-md"
            onChange={(e) => setSection(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>
              Select Section
            </option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>
          <select
            className="w-full border px-4 py-2 rounded-md"
            onChange={(e) => setSelectedRole(e.target.value)}
            defaultValue="courses"
          >
            <option value="courses">Courses</option>
            <option value="coordinators">Coordinators</option>
            <option value="mentors">Mentors</option>
          </select>
        </div>

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          onClick={fetchData}
        >
          Load Data
        </button>
      </div>

      {/* Add New Entry */}
      <div className="mt-8 bg-white shadow rounded-lg p-6 max-w-4xl mx-auto">
        <input
          type="text"
          placeholder={`Add new ${selectedRole.slice(0, -1)}`}
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          className="border px-4 py-2 rounded-md w-3/4 mr-4"
        />
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          onClick={addEntry}
        >
          Add
        </button>
      </div>

      {/* Data Table */}
      <div className="mt-8 bg-white shadow rounded-lg p-6 max-w-4xl mx-auto">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(selectedRole === "courses"
                ? courses
                : selectedRole === "coordinators"
                ? coordinators
                : mentors
              ).map((item) => (
                <tr key={item.id}>
                  <td className="border px-4 py-2">
                    <input
                      type="text"
                      defaultValue={item.name}
                      onBlur={(e) =>
                        updateEntry(item.id, e.target.value)
                      }
                      className="border px-2 py-1 rounded-md w-full"
                    />
                  </td>
                  <td className="border px-4 py-2">
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                      onClick={() => deleteEntry(item.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManageCoursesAndRoles;
