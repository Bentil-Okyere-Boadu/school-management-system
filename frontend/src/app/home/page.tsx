"use client";
import Link from "next/link";
import Image from "next/image";
import React, { useRef, useEffect, useState } from "react";

const HomePage = () => {
  // Section refs
  const featuresRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Scroll handler
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <main className="w-full min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <nav className="w-full bg-white shadow sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Logo" width={40} height={40} />
            <span className="font-bold text-lg text-[#6C63FF]">SchoolSys</span>
          </div>
          <ul className="flex items-center gap-8 font-medium text-gray-700">
            <li>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="hover:text-[#6C63FF] transition"
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection(featuresRef)}
                className="hover:text-[#6C63FF] transition"
              >
                Features
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection(aboutRef)}
                className="hover:text-[#6C63FF] transition"
              >
                About
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection(contactRef)}
                className="hover:text-[#6C63FF] transition"
              >
                Contact
              </button>
            </li>
            <li>
              {/* <Link href="/auth/login" className="bg-[#6C63FF] text-white px-4 py-2 rounded hover:bg-[#5548c8] transition">Get Started</Link> */}
              <div className="flex flex-col justify-center items-center">
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((open) => !open)}
                    className="bg-[#6C63FF] text-white px-6 py-3 rounded shadow font-medium hover:bg-[#5548c8] transition"
                  >
                    Login
                  </button>
                  {dropdownOpen && (
                    <ul className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-10">
                      <li>
                        <Link
                          href="/auth/login"
                          className="block px-4 py-2 hover:bg-gray-100"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Super Admin
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/auth/admin/login"
                          className="block px-4 py-2 hover:bg-gray-100"
                          onClick={() => setDropdownOpen(false)}
                        >
                          School Admin
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/auth/teacher/login"
                          className="block px-4 py-2 hover:bg-gray-100"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Teacher
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/auth/student/login"
                          className="block px-4 py-2 hover:bg-gray-100"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Student
                        </Link>
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            </li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#6C63FF] to-[#4F46E5] text-white py-16 px-4 flex flex-col items-center">
        <div className="max-w-5xl w-full flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Transform Your School with Automated Management
            </h1>
            <p className="mb-8 text-lg">
              Everything You Need to Manage Your School
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-white text-[#6C63FF] font-semibold px-6 py-3 rounded shadow hover:bg-gray-100 transition"
            >
              Get Started
            </Link>
          </div>
          <div className="flex-1 flex justify-center">
            <Image
              src="/images/hero-students.png"
              alt="Students"
              width={320}
              height={320}
              className="rounded-xl shadow-lg object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-16 px-4 bg-white scroll-mt-24">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 flex justify-center">
            <Image
              src="/images/feature-admin.png"
              alt="Admin Dashboard"
              width={288}
              height={288}
              className="rounded-xl shadow-lg object-cover"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-4">
              Everything You Need to Manage Your School
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li>Student Enrollment &amp; Records</li>
              <li>Attendance Tracking</li>
              <li>Result Compilation</li>
              <li>Automated Fee Management</li>
              <li>Insightful Reports</li>
            </ul>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section ref={aboutRef} className="py-16 px-4 bg-[#F3F0FF] scroll-mt-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">About Us</h2>
          <div className="flex flex-col md:flex-row gap-10">
            <div className="flex-1 flex flex-col items-center">
              <Image
                src="/images/about-dashboard.png"
                alt="About Dashboard"
                width={256}
                height={256}
                className="rounded-xl shadow-lg object-cover mb-4"
              />
              <p className="text-gray-700 text-center">
                Our platform empowers schools to automate and streamline all
                administrative processes, from admissions to graduation.
              </p>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <Image
                src="/images/about-admin.png"
                alt="About Admin"
                width={256}
                height={256}
                className="rounded-xl shadow-lg object-cover mb-4"
              />
              <p className="text-gray-700 text-center">
                Built for school administrators, teachers, and students, our
                solution is intuitive, secure, and scalable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact/Support Section */}
      <section
        ref={contactRef}
        className="py-12 px-4 bg-[#181C32] text-white scroll-mt-24"
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h2 className="text-xl font-bold mb-2">We are always here.</h2>
            <p className="mb-4">
              Contact our support team for help or inquiries.
            </p>
            <ul>
              <li>
                Email:{" "}
                <a
                  href="mailto:support@yourschoolapp.com"
                  className="underline"
                >
                  support@yourschoolapp.com
                </a>
              </li>
              <li>
                Phone:{" "}
                <a href="tel:+1234567890" className="underline">
                  +1 234 567 890
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Frequently Asked Questions</h3>
            <ul className="space-y-2 text-gray-200">
              <li>How do I reset my password?</li>
              <li>How do I enroll a new student?</li>
              <li>How do I generate reports?</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#E5E7EB] py-6 text-center text-gray-600 text-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div>
            &copy; {new Date().getFullYear()} School Management System. All
            rights reserved.
          </div>
          <div className="flex gap-4 mt-2 md:mt-0">
            <Link href="/privacy-policy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default HomePage;
