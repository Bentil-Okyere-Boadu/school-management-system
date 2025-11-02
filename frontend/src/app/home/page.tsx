"use client";
import Link from "next/link";
import Image from "next/image";
import React, { useRef, useEffect, useState } from "react";
import landingPic from "@/images/landingPic.png";
import landingPic2 from "@/images/landingPic2.png";
import aboutus1 from "@/images/aboutus1.png";
import aboutus2 from "@/images/aboutus2.png";
import AcaPlanIcon from "@/images/AcaPlan.svg";
import StudentManIcon from "@/images/SdntMngmt.svg";
import SecComIcon from "@/images/SecComp.svg";
import AnalytIcon from "@/images/AnaRep.svg";
import Logo from "@/images/logo.svg";
import backgroundImage from "@/images/background.png";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import { Group, Text, Accordion, List, ThemeIcon } from '@mantine/core';
import { IconCheck } from "@tabler/icons-react";

interface AccordionLabelProps {
  label: string;
  content: string;
}

const navLinks = [
  { label: "Home", refKey: "home" },
  { label: "About Us", refKey: "about" },
  { label: "Why Choose Us", refKey: "features" },
  { label: "Contact", refKey: "contact" },
];

const FAQs = [
  {
    label: "Is my school data secure on your platform?",
    content: "Absolutely. We use enterprise-grade security SSL encryption. Your data is stored in secure, redundant data centers with 99.9% uptime guarantee and daily backups."
  },
  {
    label: "What kind of support do you provide?",
    content: "We offer 24/7 customer support via chat, email, and phone. Our dedicated support team is here to help you with any questions or issues you may have."
  },
  {
    label: "How often do you release update?",
    content: "We offer 24/7 customer support via chat, email, and phone. Our dedicated support team is here to help you with any questions or issues you may have."
  },
  {
    label: "Is there any manual to guide me?",
    content: "We offer 24/7 customer support via chat, email, and phone. Our dedicated support team is here to help you with any questions or issues you may have."
  }
]

const HomePage = () => {
  // Section refs
  const featuresRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const aboutRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const contactRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const homeRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Scroll handler
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
      setSidebarOpen(false); // close sidebar on mobile after click
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

  // Map navLinks to refs
  const sectionRefs: Record<string, React.RefObject<HTMLDivElement>> = {
    home: homeRef,
    about: aboutRef,
    features: featuresRef,
    contact: contactRef,
  };

  const features = [
    {
      title: "Student Management",
      description: "Comprehensive student profiles, enrollment tracking, and academic progress monitoring all in one place.",
      icon: StudentManIcon
    },
    {
      title: "Academic Planning",
      description: "Plan and organize academic years, terms, subjects, and classes with ease,  ensuring smooth operations.",
      icon: AcaPlanIcon
    },
    {
      title: "Secure and Compliant",
      description: "Enterprise-grade security with FERPA compliance and role-based access controls.",
      icon: SecComIcon
    },
    {
      title: "Analytics & Reporting",
      description: "Automated attendance management with real-time notifications to parents and administrators.",
      icon: AnalytIcon
    }
  ]
  

  const featuresContainer = ({icon, title, description}: {icon: StaticImport, title: string, description: string}) => {
    return (
      <div>
        <div className="flex flex-row gap-4">
          <div>
            <Image src={icon} alt="Feature Icon" width={70} height={70} />
          </div>
          <div>
            <h5 className="font-bold mb-1">{title}</h5>
            <p className="text-sm text-gray-500 leading-6">{description}</p>
          </div>
        </div>
      </div>
    );
  }

  const AccordionLabel = ({ label }: AccordionLabelProps) => {
  return (
    <Group wrap="nowrap">
      <div>
        <Text fw={500}>{label}</Text>
        {/* <Text size="sm" c="dimmed" fw={400}>
          {content}
        </Text> */}
      </div>
    </Group>
  );
}

const items = FAQs.map((item, i) => (
    <Accordion.Item value={item.label} key={i}>
      <Accordion.Control aria-label={item.label}>
        <AccordionLabel {...item} />
      </Accordion.Control>
      <Accordion.Panel>
        <Text size="sm" c='gray'>{item.content}</Text>
      </Accordion.Panel>
    </Accordion.Item>
  ))

  return (
    <main className="w-full min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <nav className="w-full bg-gradient-to-br from-[#B860F5] to-[#7B11F9] shadow sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Image src={Logo} alt="Logo" width={40} height={40} />
            <span className="font-bold text-lg text-white">GoEdtech</span>
          </div>
          <ul className="hidden md:flex items-center gap-8 font-medium text-white">
            <li className="">
              <button
                onClick={() => scrollToSection(homeRef)}
                className="hover:text-purple-800 transition hover:underline cursor-pointer"
              >
                Home
              </button>
            </li>
            <li className="cursor-pointer">
              <button
                onClick={() => scrollToSection(aboutRef)}
                className="hover:text-purple-800 transition hover:underline cursor-pointer"
              >
                About Us
              </button>
            </li>
            <li className="cursor-pointer">
              <button
                onClick={() => scrollToSection(featuresRef)}
                className="hover:text-purple-800 transition hover:underline cursor-pointer"
              >
                Why Choose Us
              </button>
            </li>
            <li className="cursor-pointer">
              <button
                onClick={() => scrollToSection(contactRef)}
                className="hover:text-purple-800 transition hover:underline cursor-pointer"
              >
                Contact
              </button>
            </li>
          </ul>
          {/* Hamburger for mobile/tablet */}
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div className="hidden md:flex flex-col justify-center items-center">
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

      {/* Sidebar for mobile/tablet */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black opacity-40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-br from-[#B860F5] to-[#7B11F9] text-white flex flex-col py-8 px-6 z-50">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Image src={Logo} alt="Logo" width={36} height={36} />
                <span className="font-bold text-lg">GoEdtech</span>
              </div>
              <button
                className="text-white"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeWidth="2" d="M6 6l12 12M6 18L18 6"/>
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-6">
              {navLinks.map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(sectionRefs[item.refKey])}
                  className="text-left px-2 py-2 rounded hover:bg-white/20 transition"
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-10 flex flex-col justify-center items-center">
              <div className="relative w-full" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((open) => !open)}
                  className="w-full bg-white text-purple-500 px-6 py-3 rounded shadow font-medium hover:bg-purple-800 hover:text-white transition"
                >
                  Login
                </button>
                {dropdownOpen && (
                  <ul className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-10 text-gray-700">
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
          </aside>
        </div>
      )}

      {/* Hero Section */}
      <section
        ref={homeRef}
        className="relative h-[30%] text-white pt-8 pb-0 px-4 flex flex-col items-center"
        style={{
          backgroundImage: `url(${backgroundImage.src})`,
          backgroundSize: "cover"
        }}
      >
        <div className="relative max-w-5xl w-full flex flex-col md:flex-row items-center gap-10 z-10">
          <div className="md:w-[50%]">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Transform Your School with Automated Management
            </h1>
            <p className="mb-8 text-lg text-gray-300">
              Streamline operations, boost academic performance, and create exceptional educational experiences with our comprehensive school management platform
            </p>
            <Link
              href=""
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

      {/* Home 2 Section */}
      <section className="py-16 px-4 bg-white scroll-mt-24">
        <div className="flex flex-col items-center mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">
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
          <div className="flex items-center justify-center w-full md:w-[50%]">
            <List
              spacing="xl"
              size="xl"
              center
              type="ordered"
              listStyleType="decimal"
              icon={
                <ThemeIcon color="teal" size={10} radius="lg">
                </ThemeIcon>
            }
            >
              <List.Item>
                <div className="flex flex-col gap-2">
                  <h5 className="font-bold">Smart Dashboard</h5>
                  <p className="text-sm text-gray-500">
                    Get a comprehensive overview of your school&apos;s performance with real-time analytics and insights.
                  </p>
                </div>
              </List.Item>
              <List.Item>
                <div className="flex flex-col gap-2">
                  <h5 className="font-bold">Proven results</h5>
                  <p className="text-sm text-gray-500">
                    Schools see 70% improvement in administrative efficiency.
                  </p>
                </div>
              </List.Item>
              <List.Item>
                <div className="flex flex-col gap-2">
                  <h5 className="font-bold">Proven results</h5>
                  <p className="text-sm text-gray-500">
                    Schools see 70% improvement in administrative efficiency.
                  </p>
                </div>
              </List.Item>
            </List>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section ref={aboutRef} className="py-16 px-4 bg-[#F3F0FF] scroll-mt-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full  mb-8 text-center">
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
            </div>
          </div>
        </div>
      </section>
      {/* Why Choose Us Section */}
      <section ref={featuresRef} className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-purple-500 mb-6">Why Choose Us?</p>
          <h2 className="font-bold text-2xl">Everything You Need to Manage Your School</h2>
        </div>
        <div className="max-w-5xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-6 rounded-lg hover:shadow-md transition">
              {featuresContainer(feature)}
            </div>
          ))}
        </div>
      </section>

      {/* Contact/Support Section */}
      <section
        ref={contactRef}
        className="py-12 px-4 bg-[#181C32] text-white scroll-mt-24"
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">We are always here.</h2>
            <p className="mb-4">
              Feel free to reach out if you have any issues.
            </p>
            <List
              style={{ marginTop: '3.5rem' }}
              spacing="xl"
              size="md"
              center
              icon={
                <ThemeIcon color="teal" size={18} radius="lg">
                  <IconCheck size={14} />
                </ThemeIcon>
            }
            >
              <List.Item>
                <div className="flex flex-col gap-2">
                  <h5 className="font-bold">Tight Security</h5>
                  <span className="text-sm text-gray-300">We put all security measures in place to secure your school data.</span>
                </div>
              </List.Item>
              <List.Item>
                <div className="flex flex-col gap-2">
                  <h5 className="font-bold">24/7 Hour Support</h5>
                  <span className="text-sm text-gray-300">We provide 24/7 hr support for your school.</span>
                </div>
              </List.Item>
            </List>
          </div>
          <div className="bg-white w-full md:w-1/2 rounded-lg border-t-green-400 border-t-3">
            <Accordion chevronPosition="right" variant="contained" radius="md">
              {items}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#E5E7EB] py-6 text-center text-gray-600 text-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div>
            &copy; {new Date().getFullYear()} GoEdtech. All
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
