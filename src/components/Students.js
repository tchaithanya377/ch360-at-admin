import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";
import { FaEdit, FaTrash } from "react-icons/fa";

function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [studentData, setStudentData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    fatherName: "",
    motherName: "",
    siblings: "",
    currentCourses: [{ course: "", progress: "" }],
    professionalExperience: [{ title: "", company: "", duration: "", description: "" }],
    skills: [""],
    projects: [{ name: "", description: "" }],
    education: { degree: "", university: "", year: "" },
    mentorDetails: { name: "", email: "", phone: "" },
    customFields: [],
  });

  const [editingId, setEditingId] = useState(null);

  // Fetch students from Firebase
  useEffect(() => {
    const fetchStudents = async () => {
      const querySnapshot = await getDocs(collection(db, "students"));
      setStudents(
        querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };
    fetchStudents();
  }, []);

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudentData({ ...studentData, [name]: value });
  };

  // Handle Custom Field Change
  const handleCustomFieldChange = (index, e) => {
    const { name, value } = e.target;
    const customFields = [...studentData.customFields];
    customFields[index] = { ...customFields[index], [name]: value };
    setStudentData({ ...studentData, customFields });
  };

  // Add or Update Student
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      // Update student
      const studentRef = doc(db, "students", editingId);
      await updateDoc(studentRef, studentData);
      setEditingId(null);
    } else {
      // Add new student
      await addDoc(collection(db, "students"), studentData);
    }
    setStudentData({
      name: "",
      email: "",
      phone: "",
      address: "",
      fatherName: "",
      motherName: "",
      siblings: "",
      currentCourses: [{ course: "", progress: "" }],
      professionalExperience: [{ title: "", company: "", duration: "", description: "" }],
      skills: [""],
      projects: [{ name: "", description: "" }],
      education: { degree: "", university: "", year: "" },
      mentorDetails: { name: "", email: "", phone: "" },
      customFields: [],
    });
  };

  // Delete Student
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "students", id));
    setStudents(students.filter((student) => student.id !== id));
  };

  // Edit Student
  const handleEdit = (student) => {
    setStudentData(student);
    setEditingId(student.id);
  };

  // Add Custom Field
  const addCustomField = () => {
    setStudentData({
      ...studentData,
      customFields: [...studentData.customFields, { key: "", value: "" }],
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
          Manage Students
        </h1>
        <motion.form
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-lg rounded-lg p-6 space-y-4"
          onSubmit={handleSubmit}
        >
          <h2 className="text-2xl font-semibold text-gray-700">
            {editingId ? "Edit" : "Add"} Student
          </h2>

          <h3 className="text-xl font-semibold text-gray-700 mt-4">Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={studentData.name}
              onChange={handleChange}
              required
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={studentData.email}
              onChange={handleChange}
              required
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="phone"
              placeholder="Phone"
              value={studentData.phone}
              onChange={handleChange}
              required
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={studentData.address}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="fatherName"
              placeholder="Father's Name"
              value={studentData.fatherName}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="motherName"
              placeholder="Mother's Name"
              value={studentData.motherName}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              name="siblings"
              placeholder="Siblings"
              value={studentData.siblings}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <h3 className="text-xl font-semibold text-gray-700 mt-4">Mentor Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Mentor Name"
              value={studentData.mentorDetails.name}
              onChange={(e) => {
                const newMentorDetails = { ...studentData.mentorDetails, name: e.target.value };
                setStudentData({ ...studentData, mentorDetails: newMentorDetails });
              }}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              name="email"
              placeholder="Mentor Email"
              value={studentData.mentorDetails.email}
              onChange={(e) => {
                const newMentorDetails = { ...studentData.mentorDetails, email: e.target.value };
                setStudentData({ ...studentData, mentorDetails: newMentorDetails });
              }}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="phone"
              placeholder="Mentor Phone"
              value={studentData.mentorDetails.phone}
              onChange={(e) => {
                const newMentorDetails = { ...studentData.mentorDetails, phone: e.target.value };
                setStudentData({ ...studentData, mentorDetails: newMentorDetails });
              }}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <h3 className="text-xl font-semibold text-gray-700 mt-4">Project Details</h3>
          {studentData.projects.map((project, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Project Name"
                value={project.name}
                onChange={(e) => {
                  const newProjects = [...studentData.projects];
                  newProjects[index].name = e.target.value;
                  setStudentData({ ...studentData, projects: newProjects });
                }}
                className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                name="description"
                placeholder="Project Description"
                value={project.description}
                onChange={(e) => {
                  const newProjects = [...studentData.projects];
                  newProjects[index].description = e.target.value;
                  setStudentData({ ...studentData, projects: newProjects });
                }}
                className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition duration-200 mt-4"
          >
            {editingId ? "Update" : "Add"} Student
          </button>
        </motion.form>

        {/* Family Details */}
        <h3 className="text-xl font-semibold text-gray-700 mt-4">Family Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="fatherName"
            placeholder="Father's Name"
            value={studentData.fatherName}
            onChange={handleChange}
            className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="motherName"
            placeholder="Mother's Name"
            value={studentData.motherName}
            onChange={handleChange}
            className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            name="siblings"
            placeholder="Siblings"
            value={studentData.siblings}
            onChange={handleChange}
            className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Current Courses */}
        <h3 className="text-xl font-semibold text-gray-700 mt-4">Current Courses</h3>
        {studentData.currentCourses.map((course, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="course"
              placeholder="Course"
              value={course.course}
              onChange={(e) => {
                const newCourses = [...studentData.currentCourses];
                newCourses[index].course = e.target.value;
                setStudentData({ ...studentData, currentCourses: newCourses });
              }}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="progress"
              placeholder="Progress"
              value={course.progress}
              onChange={(e) => {
                const newCourses = [...studentData.currentCourses];
                newCourses[index].progress = e.target.value;
                setStudentData({ ...studentData, currentCourses: newCourses });
              }}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
        <button
          onClick={() => setStudentData({ ...studentData, currentCourses: [...studentData.currentCourses, { course: "", progress: "" }] })}
          className="w-full py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition duration-200 mt-4"
        >
          Add Course
        </button>

        {/* Professional Experience */}
        <h3 className="text-xl font-semibold text-gray-700 mt-4">Professional Experience</h3>
        {studentData.professionalExperience.map((experience, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="title"
              placeholder="Title"
              value={experience.title}
              onChange={(e) => {
                const newExperience = [...studentData.professionalExperience];
                newExperience[index].title = e.target.value;
                setStudentData({ ...studentData, professionalExperience: newExperience });
              }}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="company"
              placeholder="Company"
              value={experience.company}
              onChange={(e) => {
                const newExperience = [...studentData.professionalExperience];
                newExperience[index].company = e.target.value;
                setStudentData({ ...studentData, professionalExperience: newExperience });
              }}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="duration"
              placeholder="Duration"
              value={experience.duration}
              onChange={(e) => {
                const newExperience = [...studentData.professionalExperience];
                newExperience[index].duration = e.target.value;
                setStudentData({ ...studentData, professionalExperience: newExperience });
              }}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="description"
              placeholder="Description"
              value={experience.description}
              onChange={(e) => {
                const newExperience = [...studentData.professionalExperience];
                newExperience[index].description = e.target.value;
                setStudentData({ ...studentData, professionalExperience: newExperience });
              }}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
        <button
          onClick={() => setStudentData({ ...studentData, professionalExperience: [...studentData.professionalExperience, { title: "", company: "", duration: "", description: "" }] })}
          className="w-full py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition duration-200 mt-4"
        >
          Add Experience
        </button>

        {/* Skills */}
        <h3 className="text-xl font-semibold text-gray-700 mt-4">Skills</h3>
        {studentData.skills.map((skill, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="skill"
              placeholder="Skill"
              value={skill}
              onChange={(e) => {
                const newSkills = [...studentData.skills];
                newSkills[index] = e.target.value;
                setStudentData({ ...studentData, skills: newSkills });
              }}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
        <button
          onClick={() => setStudentData({ ...studentData, skills: [...studentData.skills, ""] })}
          className="w-full py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition duration-200 mt-4"
        >
          Add Skill
        </button>

        {/* Education */}
        <h3 className="text-xl font-semibold text-gray-700 mt-4">Education</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="degree"
            placeholder="Degree"
            value={studentData.education.degree}
            onChange={(e) => {
              const newEducation = { ...studentData.education, degree: e.target.value };
              setStudentData({ ...studentData, education: newEducation });
            }}
            className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="university"
            placeholder="University"
            value={studentData.education.university}
            onChange={(e) => {
              const newEducation = { ...studentData.education, university: e.target.value };
              setStudentData({ ...studentData, education: newEducation });
            }}
            className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="year"
            placeholder="Year"
            value={studentData.education.year}
            onChange={(e) => {
              const newEducation = { ...studentData.education, year: e.target.value };
              setStudentData({ ...studentData, education: newEducation });
            }}
            className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 my-6">Student List</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {students.map((student) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white shadow-lg rounded-lg p-4 flex flex-col"
            >
              <h3 className="text-xl font-semibold text-gray-800">
                {student.name}
              </h3>
              <p className="text-gray-600">{student.email}</p>
              <div className="mt-4 flex justify-between">
                <button
                  onClick={() => handleEdit(student)}
                  className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
                >
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={() => handleDelete(student.id)}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        {/* Add Custom Field Button */}
        <button
          onClick={addCustomField}
          className="w-full py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition duration-200 mt-4"
        >
          Add Custom Field
        </button>

        {/* Render Custom Fields */}
        {studentData.customFields.map((field, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <input
              type="text"
              name="key"
              placeholder="Field Key"
              value={field.key}
              onChange={(e) => handleCustomFieldChange(index, e)}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="value"
              placeholder="Field Value"
              value={field.value}
              onChange={(e) => handleCustomFieldChange(index, e)}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManageStudents;