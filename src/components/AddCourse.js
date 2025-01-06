import React, { useState } from "react";
import { db } from "../firebase"; // Adjust the path to your Firebase configuration file
import { doc, collection, addDoc } from "firebase/firestore";

const AddCourse = () => {
  const [formData, setFormData] = useState({
    courseName: "",
    courseCode: "",
    instructor: "",
    year: "I",
    section: "A",
    sem: "1",
    actualHours: "",
    deviationReasons: "",
    leavesAvailed: "",
    cls: "",
    ods: "",
    permissions: "",
    unitsCompleted: "",
    syllabusCoverage: "",
    coveragePercentage: "",
  });

  // Handle manual form submission
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const { year, section, sem, ...courseDetails } = formData;

    if (!year || !section || !sem) {
      alert("Please fill in all required fields (year, section, semester)");
      return;
    }

    const sectionPath = `courses/${year}/${section}/sem${sem}/courseDetails`;
    const courseCollection = collection(db, sectionPath);

    try {
      await addDoc(courseCollection, courseDetails);
      alert("Manual data added successfully!");
      setFormData({
        courseName: "",
        courseCode: "",
        instructor: "",
        year: "I",
        section: "A",
        sem: "1",
        actualHours: "",
        deviationReasons: "",
        leavesAvailed: "",
        cls: "",
        ods: "",
        permissions: "",
        unitsCompleted: "",
        syllabusCoverage: "",
        coveragePercentage: "",
      });
    } catch (error) {
      console.error("Error adding course:", error);
      alert("Failed to add course. Please try again.");
    }
  };

  return (
    <div className="p-5 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-center mb-6">Add Course</h1>

      {/* Manual Data Entry Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Add Course Manually</h2>
        <form onSubmit={handleFormSubmit} className="bg-white p-5 rounded shadow">
          <label className="block mb-3">
            Year
            <select
              name="year"
              value={formData.year}
              onChange={handleFormChange}
              className="block p-2 border rounded w-full"
            >
              {['I', 'II', 'III', 'IV'].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
          <label className="block mb-3">
            Section
            <select
              name="section"
              value={formData.section}
              onChange={handleFormChange}
              className="block p-2 border rounded w-full"
            >
              {['A', 'B', 'C', 'D', 'E', 'F'].map((section) => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </label>
          <label className="block mb-3">
            Semester
            <select
              name="sem"
              value={formData.sem}
              onChange={handleFormChange}
              className="block p-2 border rounded w-full"
            >
              {["1", "2"].map((sem) => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </label>
          <input
            type="text"
            name="courseName"
            value={formData.courseName}
            onChange={handleFormChange}
            placeholder="Course Name"
            className="block mb-3 p-2 border rounded w-full"
            required
          />
          <input
            type="text"
            name="courseCode"
            value={formData.courseCode}
            onChange={handleFormChange}
            placeholder="Course Code"
            className="block mb-3 p-2 border rounded w-full"
            required
          />
          <input
            type="text"
            name="instructor"
            value={formData.instructor}
            onChange={handleFormChange}
            placeholder="Instructor Name"
            className="block mb-3 p-2 border rounded w-full"
          />
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Add Course
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCourse;
