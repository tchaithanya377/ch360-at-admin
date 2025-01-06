import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";

const Dashboard = () => {
  const [studentsData, setStudentsData] = useState({});
  const [coursesData, setCoursesData] = useState({});
  const [facultyCount, setFacultyCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);

      try {
        const years = ["II", "III", "IV"];
        const sections = ["A", "B", "C"];
        const studentsPerSection = {};
        const coursesPerYear = {};
        let totalFaculty = 0;

        // Initialize data structures
        years.forEach((year) => {
          studentsPerSection[year] = {};
          coursesPerYear[year] = 0;
          sections.forEach((section) => {
            studentsPerSection[year][section] = 0;
          });
        });

        // Fetch students and courses data
        for (const year of years) {
          for (const section of sections) {
            // Fetch students
            const studentsPath = `students/${year}/${section}`;
            const studentsSnapshot = await getDocs(collection(db, studentsPath));
            studentsPerSection[year][section] = studentsSnapshot.size;

            // Fetch courses (sem1/courseDetails)
            const coursesPath = `courses/${year}/${section}/sem1/courseDetails`;
            const coursesSnapshot = await getDocs(collection(db, coursesPath));

            if (!coursesSnapshot.empty) {
              coursesPerYear[year] += coursesSnapshot.size;
            }
          }
        }

        // Fetch faculty count
        const facultySnapshot = await getDocs(collection(db, "faculty"));
        totalFaculty = facultySnapshot.size;

        // Update state
        setStudentsData(studentsPerSection);
        setCoursesData(coursesPerYear);
        setFacultyCount(totalFaculty);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Campus Dashboard</h1>
        {isLoading ? (
          <div className="flex justify-center items-center">
            <div className="animate-spin w-12 h-12 border-t-4 border-blue-500 rounded-full"></div>
            <p className="ml-4 text-lg">Loading...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              transition={{ duration: 0.5, staggerChildren: 0.2 }}
            >
              <motion.div
                className="bg-green-600 shadow-lg rounded-lg p-6 text-center hover:scale-105 transition-transform"
                variants={cardVariants}
              >
                <h2 className="text-2xl font-semibold mb-2">Total Students</h2>
                <p className="text-5xl font-bold">
                  {Object.values(studentsData)
                    .flatMap((sec) => Object.values(sec))
                    .reduce((a, b) => a + b, 0)}
                </p>
              </motion.div>
              <motion.div
                className="bg-blue-600 shadow-lg rounded-lg p-6 text-center hover:scale-105 transition-transform"
                variants={cardVariants}
              >
                <h2 className="text-2xl font-semibold mb-2">Total Courses</h2>
                <p className="text-5xl font-bold">
                  {Object.values(coursesData).reduce((a, b) => a + b, 0)}
                </p>
              </motion.div>
              <motion.div
                className="bg-pink-600 shadow-lg rounded-lg p-6 text-center hover:scale-105 transition-transform"
                variants={cardVariants}
              >
                <h2 className="text-2xl font-semibold mb-2">Total Faculty</h2>
                <p className="text-5xl font-bold">{facultyCount}</p>
              </motion.div>
            </motion.div>

            {/* Detailed Information */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              transition={{ duration: 0.5, staggerChildren: 0.2 }}
            >
              {/* Students per Section */}
              <motion.div
                className="bg-gray-800 p-6 rounded-lg shadow-lg"
                variants={cardVariants}
              >
                <h3 className="text-xl font-semibold mb-4">Students Per Section</h3>
                <ul>
                  {Object.keys(studentsData).map((year) => (
                    <li key={year} className="mb-2">
                      <h4 className="font-bold text-lg mb-1">{year} Year</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {Object.entries(studentsData[year]).map(([section, count]) => (
                          <p key={section} className="text-sm">
                            <span className="font-bold">{section}:</span> {count}
                          </p>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Courses per Year */}
              <motion.div
                className="bg-gray-800 p-6 rounded-lg shadow-lg"
                variants={cardVariants}
              >
                <h3 className="text-xl font-semibold mb-4">Courses Per Year</h3>
                <ul>
                  {Object.entries(coursesData).map(([year, count]) => (
                    <li
                      key={year}
                      className="mb-2 flex justify-between items-center"
                    >
                      <span className="font-bold">{year} Year</span>
                      <span>{count} Courses</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
