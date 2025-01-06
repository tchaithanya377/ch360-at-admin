import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaBook,
  FaTasks,
  FaPlus,
  FaUsersCog,
  FaCalendarAlt,
  FaClipboardList,
  FaUserPlus,
  FaUserCheck,
  FaChalkboard,
  FaUserTie,
  FaUsers,
  FaSignOutAlt,
} from "react-icons/fa";

const AdminNavbar = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const dropdowns = [
    {
      title: "Students",
      links: [
        { name: "Manage Students", path: "/students", icon: <FaUserGraduate /> },
        { name: "Add Student", path: "/addstudent", icon: <FaPlus /> },
      ],
    },
    {
      title: "Faculty",
      links: [
        { name: "Manage Faculty", path: "/faculty", icon: <FaChalkboardTeacher /> },
        { name: "Add Faculty", path: "/addfaculty", icon: <FaPlus /> },
      ],
    },
    {
      title: "Courses",
      links: [
        { name: "Manage Courses", path: "/courses", icon: <FaBook /> },
        { name: "Add Course", path: "/addcourse", icon: <FaPlus /> },
      ],
    },
    {
      title: "Timetable",
       links: [
        { name: "Weekly Timetable", path: "/weeklytimetable", icon: <FaCalendarAlt /> },
        { name: "Create Timetable", path: "/createtimetable", icon: <FaPlus /> },
       ],
     },
    {
      title: "Assign",
      links: [
        { name: "Faculty Assigned", path: "/facultyassignments", icon: <FaTasks /> },
        { name: "Course Assign", path: "/relationships", icon: <FaUserTie /> },
        { name: "Coordinator Assignment", path: "/coordinator", icon: <FaChalkboard /> },
      ],
    },
    {
      title: "No Dues",
      links: [
        { name: "No Dues", path: "/nodues", icon: <FaClipboardList /> },
        { name: "Manage Dues", path: "/noduesmanagement", icon: <FaUsersCog /> },
      ],
    },
    {
      title: "Mentors",
      links: [
        { name: "Manage Mentors", path: "/managementors", icon: <FaUsers /> },
        { name: "Assign Mentors", path: "/mentor", icon: <FaUsers /> },
      ],
    },
  ];

  const otherLinks = [
    { name: "Dashboard", path: "/dashboard", icon: <FaTachometerAlt /> },
    { name: "Create User", path: "/createuser", icon: <FaUserPlus /> },
    { name: "Attendance", path: "/attendance", icon: <FaUserCheck /> },
    { name: "CreateTimetable", path:"createtimetable", icon: <FaUserCheck/>}
  ];

  const handleMobileClose = () => {
    setIsMobileOpen(false);
    setOpenDropdown(null); // Close any open dropdowns
  };

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/dashboard" className="text-2xl font-bold text-orange-500">
            CampusHub360
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-6 items-center">
            {dropdowns.map((dropdown, index) => (
              <div key={index} className="relative">
                <button
                  className="flex items-center text-sm font-semibold text-gray-300 focus:outline-none"
                  onClick={() =>
                    setOpenDropdown(openDropdown === index ? null : index)
                  }
                >
                  {dropdown.title}
                  <svg
                    className={`ml-1 h-4 w-4 transform ${
                      openDropdown === index ? "rotate-180" : ""
                    } transition`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </button>
                {openDropdown === index && (
                  <div className="absolute left-0 flex flex-col bg-gray-800 shadow-lg mt-2 rounded-md z-10 w-48">
                    {dropdown.links.map((link) => (
                      <Link
                        key={link.name}
                        to={link.path}
                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-orange-500 hover:text-white rounded-md"
                      >
                        {link.icon}
                        <span className="ml-2">{link.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {otherLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="flex items-center text-sm font-semibold text-gray-300"
              >
                {link.icon}
                <span className="ml-2">{link.name}</span>
              </Link>
            ))}

            {/* Logout */}
            <Link
              to="/"
              className="flex items-center text-sm font-semibold text-red-500"
            >
              <FaSignOutAlt />
              <span className="ml-2">Logout</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden bg-gray-800 p-2 rounded-md"
          >
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isMobileOpen && (
        <div className="md:hidden bg-gray-800">
          {dropdowns.map((dropdown, index) => (
            <div key={index} className="py-2">
              <div className="text-sm font-semibold text-gray-400 px-4">
                {dropdown.title}
              </div>
              {dropdown.links.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={handleMobileClose}
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-orange-500 hover:text-white"
                >
                  {link.icon}
                  <span className="ml-2">{link.name}</span>
                </Link>
              ))}
            </div>
          ))}

          {otherLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={handleMobileClose}
              className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-orange-500 hover:text-white"
            >
              {link.icon}
              <span className="ml-2">{link.name}</span>
            </Link>
          ))}

          {/* Logout */}
          <Link
            to="/"
            onClick={handleMobileClose}
            className="flex items-center px-4 py-2 text-sm text-red-500 hover:text-red-400"
          >
            <FaSignOutAlt />
            <span className="ml-2">Logout</span>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default AdminNavbar;
