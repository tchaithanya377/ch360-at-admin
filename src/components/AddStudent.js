import React, { useState } from "react";
import { db } from "../firebase"; // Firebase Firestore configuration
import { collection, doc, setDoc, query, where, getDocs } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"; // Firebase Authentication
import * as XLSX from "xlsx";

const AddStudent = () => {
  const [studentData, setStudentData] = useState({
    rollNo: "",
    name: "",
    quota: "",
    gender: "",
    aadhaar: "",
    studentMobile: "",
    fatherMobile: "",
    fatherName: "",
    motherName: "",
    address: "",
  });

  const [excelData, setExcelData] = useState([]);
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [popupMessage, setPopupMessage] = useState(""); // Popup message
  const [isPopupVisible, setIsPopupVisible] = useState(false); // Popup visibility
  const [isUploading, setIsUploading] = useState(false); // Upload status

  const auth = getAuth(); // Firebase Authentication instance

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); // Delay function

  const handlePopup = (message) => {
    setPopupMessage(message);
    setIsPopupVisible(true);
    setTimeout(() => setIsPopupVisible(false), 3000);
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudentData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Create student account in Firebase Auth and Firestore with nested collections
  const createStudentAccount = async (student, year, section) => {
    const email = `${student.rollNo.replace(/\s+/g, "")}@mits.ac.in`.toLowerCase(); // Remove spaces
    const password = "Rest@1234";

    try {
      // Check if the student email already exists in Firestore
      const existingQuery = query(
        collection(db, `students/${year}/${section}`),
        where("email", "==", email)
      );
      const querySnapshot = await getDocs(existingQuery);

      if (!querySnapshot.empty) {
        console.log(`Student with email ${email} already exists.`);
        return; // Skip duplicate
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Store student data in Firestore under year -> section -> student
      const sectionRef = collection(db, `students/${year}/${section}`);
      await setDoc(doc(sectionRef, uid), {
        ...student,
        email,
        uid,
      });

      console.log(`Student added to ${year} ${section}: ${email}`);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        console.error(`Email already in use: ${email}`);
        handlePopup(`Email already in use: ${email}`);
      } else if (error.code === "auth/too-many-requests") {
        console.error("Too many requests. Please wait before trying again.");
        handlePopup("Too many requests. Please wait before trying again.");
      } else if (error.code === "auth/invalid-email") {
        console.error(`Invalid email: ${email}`);
        handlePopup("Invalid email generated. Check the roll number.");
      } else {
        console.error("Error creating student account:", error.message);
        handlePopup(`Error: ${error.message}`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!year || !section) {
      handlePopup("Year and Section are required.");
      return;
    }

    const studentDataWithYearSection = {
      ...studentData,
      year,
      section,
      rollNo: studentData.rollNo.replace(/\s+/g, ""), // Trim spaces from roll number
      email: `${studentData.rollNo.replace(/\s+/g, "")}@mits.ac.in`.toLowerCase(),
      password: "Reset@1234",
    };

    try {
      if (!studentDataWithYearSection.rollNo || !studentDataWithYearSection.name) {
        handlePopup("Roll number and name are required fields.");
        return;
      }

      // Add student to the nested collection
      await createStudentAccount(studentDataWithYearSection, year, section);

      handlePopup("Student added successfully!");
      setStudentData({
        rollNo: "",
        name: "",
        quota: "",
        gender: "",
        aadhaar: "",
        studentMobile: "",
        fatherMobile: "",
        fatherName: "",
        motherName: "",
        address: "",
      });
    } catch (error) {
      console.error("Error adding student:", error);
      handlePopup("Failed to add student. Please try again.");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      handlePopup("Please upload a valid Excel file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const allData = [];

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const standardizedData = jsonData.map((row) => ({
          rollNo: row["Roll. No"] || row["Roll No"] || row["Unnamed: 1"] || "",
          name: row["Student Name"] || row["Unnamed: 2"] || "",
          quota: row["Quota"] || "",
          gender: row["Gender"] || "",
          aadhaar: row["Aadhaar"] || "",
          studentMobile: row["Student Mobile"] || "",
          fatherMobile: row["Father Mobile"] || "",
          fatherName: row["Father Name"] || row["Unnamed: 6"] || "",
          motherName: row["Mother Name"] || row["Unnamed: 7"] || "",
          address: row["Permanent Address"] || row["Unnamed: 10"] || "",
        }));

        const matches = sheetName.match(/^([A-Za-z0-9]+)\s+([A-Za-z]+)$/);
        const year = matches && matches[1] ? matches[1].toUpperCase() : "UNKNOWN_YEAR";
        const section = matches && matches[2] ? matches[2].toUpperCase() : "UNKNOWN_SECTION";

        standardizedData.forEach((row) => {
          if (row.rollNo && row.name) {
            allData.push({
              ...row,
              Year: year,
              Section: section,
              rollNo: row.rollNo.replace(/\s+/g, ""), // Trim spaces
              email: `${row.rollNo.replace(/\s+/g, "")}@mits.ac.in`.toLowerCase(),
              password: "Mits@1234",
            });
          }
        });
      });

      if (allData.length === 0) {
        handlePopup("No valid data found in the uploaded Excel file.");
        return;
      }

      setExcelData(allData);
      handlePopup("Excel file processed successfully!");
    };

    reader.onerror = (error) => {
      console.error("Error reading Excel file:", error);
      handlePopup("Failed to process the Excel file. Please check the file format.");
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFilteredUpload = async () => {
    if (!year || !section) {
      handlePopup("Year and Section are required.");
      return;
    }

    setIsUploading(true); // Show uploading status

    try {
      const filteredData = excelData.filter(
        (student) => student.Year === year.toUpperCase() && student.Section === section.toUpperCase()
      );

      if (filteredData.length === 0) {
        handlePopup("No matching data found for the selected Year and Section.");
        setIsUploading(false);
        return;
      }

      for (const student of filteredData) {
        await createStudentAccount(student, year, section);
        await delay(500); // Add delay to prevent Firebase rate limits
      }

      handlePopup("Filtered data uploaded successfully!");
      setExcelData([]);
    } catch (error) {
      console.error("Error uploading filtered data:", error);
      handlePopup("Failed to upload filtered data. Please try again.");
    } finally {
      setIsUploading(false); // Hide uploading status
    }
  };

  return (
    <div className="p-6">
      {isPopupVisible && (
        <div className="popup bg-gray-800 text-white p-3 rounded-lg fixed top-5 right-5">
          {popupMessage}
        </div>
      )}
      <h1 className="text-3xl font-bold mb-6">Add Student</h1>
      <form onSubmit={handleSubmit} className        ="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          {Object.keys(studentData).map((field) => (
            <div key={field}>
              <label
                htmlFor={field}
                className="block text-sm font-medium text-gray-700 capitalize"
              >
                {field}
              </label>
              <input
                type="text"
                id={field}
                name={field}
                value={studentData[field]}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <input
            type="text"
            placeholder="Year (e.g., III)"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-lg"
          />
          <input
            type="text"
            placeholder="Section (e.g., A)"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-lg"
          />
        </div>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Add Student
        </button>
      </form>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Upload Excel File</h2>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          className="block w-full mb-4"
        />
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Year (e.g., III)"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="block w-1/2 p-2 border border-gray-300 rounded-lg"
          />
          <input
            type="text"
            placeholder="Section (e.g., A)"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="block w-1/2 p-2 border border-gray-300 rounded-lg"
          />
        </div>
        <button
          onClick={handleFilteredUpload}
          disabled={isUploading || excelData.length === 0}
          className={`px-4 py-2 rounded-lg text-white ${
            isUploading ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {isUploading ? "Uploading..." : "Upload Filtered Data"}
        </button>
      </div>
    </div>
  );
};

export default AddStudent;

