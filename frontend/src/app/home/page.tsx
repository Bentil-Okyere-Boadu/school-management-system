"use client";
import Link from "next/link";
import Image from "next/image";
import React, { useRef, useEffect, useState } from "react";
import landingPic from "@/images/landingPic.png";
import landingPic2 from "@/images/landingPic2.png";
import aboutus1 from "@/images/aboutus1.png";
import aboutus2 from "@/images/aboutus2.png";
import backgroundImage from "@/images/background.png";

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
      {/* Navigation bg gradient: bg-gradient-to-br from-[#B860F5] to-[#7B11F9] */}
      <nav className="w-full bg-gradient-to-br from-[#B860F5] to-[#7B11F9] shadow sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Logo" width={40} height={40} />
            <span className="font-bold text-lg text-white">Go Edutech</span>
          </div>
          <ul className="flex items-center gap-8 font-medium text-white">
            <li className="cursor-pointer">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="hover:text-purple-800 transition"
              >
                Home
              </button>
            </li>
            <li className="cursor-pointer">
              <button
                onClick={() =>
                  scrollToSection(
                    featuresRef as React.RefObject<HTMLDivElement>
                  )
                }
                className="hover:text-purple-800 transition"
              >
                Features
              </button>
            </li>
            <li className="cursor-pointer">
              <button
                onClick={() =>
                  scrollToSection(aboutRef as React.RefObject<HTMLDivElement>)
                }
                className="hover:text-purple-800 transition"
              >
                About
              </button>
            </li>
            <li className="cursor-pointer">
              <button
                onClick={() =>
                  scrollToSection(contactRef as React.RefObject<HTMLDivElement>)
                }
                className="hover:text-purple-800 transition"
              >
                Contact
              </button>
            </li>
          </ul>  
              <div className="flex flex-col justify-center items-center">
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((open) => !open)}
                    className="bg-white text-purple-500 px-6 py-3 rounded shadow font-medium hover:bg-purple-800 hover:text-white transition"
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
          
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative h-[30%] text-white pt-8 pb-0 px-4 flex flex-col items-center"
        style={{
          backgroundImage: `url(${backgroundImage.src})`,
          backgroundSize: "cover"
        }}
      >
        <div className="relative max-w-5xl w-full flex flex-col md:flex-row items-center gap-10 z-10">
          <div className="w-[50%]">
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
          <div className="h-[35rem] right-8 relative flex justify-center">
            <Image
              src={landingPic}
              alt="Students"
              width={900}
              height={900}
              className="rounded-xl object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-16 px-4 bg-white scroll-mt-24">
        <div className="flex flex-col items-center mb-12 text-center">
            <h1 className="text-3xl font-bold mb-4">
              Everything You Need to Manage Your School
            </h1>
            <p>From student enrollment to graduation, our comprehensive platform handles every aspect <br/> of school administration with ease and precision.</p>
        </div>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 flex justify-center">
            <Image
              src={landingPic2}
              alt="Admin Dashboard"
              width={600}
              height={600}
              className="rounded-xl shadow-lg object-cover"
            />
          </div>
          <div className="flex-1">
            <ol className="space-y-3 text-gray-700">
              <li>Student Enrollment &amp; Records</li>
              <li>Attendance Tracking</li>
              <li>Result Compilation</li>
              <li>Automated Fee Management</li>
              <li>Insightful Reports</li>
            </ol>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section ref={aboutRef} className="py-16 px-4 bg-[#F3F0FF] scroll-mt-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full text-start mb-8">
                <h2 className="text-3xl font-bold mb-6">About Us</h2>
                <p>We help automate all tasks about your school. <br/> We make it way easy to run a school.</p>
              </div>
              <Image
                src={aboutus1}
                alt="About Dashboard"
                width={300}
                height={300}
                className="rounded-xl shadow-lg object-cover mb-4"
              />
              
            </div>
            <div className="flex-1 flex flex-col items-center">
              <Image
                src={aboutus2}
                alt="About Admin"
                width={300}
                height={300}
                className="rounded-xl shadow-lg object-cover mb-4"
              />
              {/* <p className="text-gray-700 text-center">
                Built for school administrators, teachers, and students, our
                solution is intuitive, secure, and scalable.
              </p> */}
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
