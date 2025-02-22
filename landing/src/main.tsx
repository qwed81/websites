import { StrictMode } from 'react'
import * as Si from '@icons-pack/react-simple-icons'
import React, { useState, useEffect, useRef } from 'react';
import { Mail } from 'lucide-react';
import { createRoot } from 'react-dom/client'
import './index.css'

interface Section {
  id: string;
  label: string;
  Component: React.FC;
}

interface NavigationProps {
  sections: Section[];
  activeSection: string;
}

interface SocialLink {
  type: string;
  url: string;
  icon: React.ReactNode;
}

interface TeamMemberProps {
  name: string;
  role: string;
  image?: string;
  links: SocialLink[];
}

interface Technology {
  name: string;
  icon: React.ReactNode;
}

interface ProjectProps {
  title: string;
  description: string;
  technologies: Technology[];
  image?: string;
  link?: string;
}

function Logo() {
  return (
    <div className="flex items-center gap-4">
      <h1 className="text-xl font-semibold">SmartFellas</h1>
    </div>
  );
}

function NavigationPill({ sections, activeSection }: NavigationProps) {
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updatePillPosition() {
      if (!activeSection) {
        setPillStyle({ left: 0, width: 0 });
        return;
      }

      const activeLink = navRef.current?.querySelector(`[data-section="${activeSection}"]`);
      if (activeLink && navRef.current) {
        const navRect = navRef.current.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();
        setPillStyle({
          left: linkRect.left - navRect.left,
          width: linkRect.width,
        });
      }
    }

    updatePillPosition();
    window.addEventListener('resize', updatePillPosition);
    return () => window.removeEventListener('resize', updatePillPosition);
  }, [activeSection]);

  return (
    <div
      ref={navRef}
      className="relative flex gap-6 bg-gray-800/30 px-6 py-2"
    >
      <NavigationBackground pillStyle={pillStyle} />
      <NavigationLinks sections={sections} activeSection={activeSection} />
    </div>
  );
}

function NavigationBackground({ pillStyle }: { pillStyle: { left: number; width: number } }) {
  return (
    <div
      className={`absolute bg-emerald-900/50 transition-all duration-300 ease-in-out ${pillStyle.width === 0 ? 'opacity-0' : 'opacity-100'}`}
      style={{
        left: pillStyle.left,
        width: pillStyle.width,
        height: '32px',
        top: '50%',
        transform: 'translateY(-50%)'
      }}
    />
  );
}

function NavigationLinks({ sections, activeSection }: NavigationProps) {
  return (
    <>
      {sections.map(section => (
        <a
          key={section.id}
          href={`#${section.id}`}
          data-section={section.id}
          className={`px-4 py-1 relative z-10 transition-colors duration-300 ${activeSection === section.id ? 'text-emerald-400' : 'hover:text-emerald-300'
            }`}
        >
          {section.label}
        </a>
      ))}
    </>
  );
}

function ProjectCard({ title, description, technologies, image, link }: ProjectProps) {
  return (
    <div className="bg-emerald-800/30 p-6 backdrop-blur-sm border border-emerald-700/30">
      <ProjectImage title={title} image={image} />
      <ProjectInfo title={title} description={description} />
      <TechnologyTags technologies={technologies} />
      <ProjectLink link={link} />
    </div>
  );
}

function ProjectImage({ title, image }: { title: string; image?: string }) {
  return (
    <div className="aspect-video overflow-hidden mb-4 bg-emerald-900/50">
      <img
        src={image || "/api/placeholder/640/360"}
        alt={title}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

function ProjectInfo({ title, description }: { title: string; description: string }) {
  return (
    <>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-emerald-100/80 mb-4">{description}</p>
    </>
  );
}

function TechnologyTags({ technologies }: { technologies: Technology[] }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {technologies.map((tech, index) => (
        <span
          key={index}
          className="px-3 py-1 bg-emerald-900/50 text-sm text-emerald-300 border border-emerald-700/30 flex items-center gap-2"
        >
          {tech.icon}
          {tech.name}
        </span>
      ))}
    </div>
  );
}

function ProjectLink({ link }: { link?: string }) {
  if (!link) return null;

  return (
    <a
      href={link}
      className="text-emerald-400 hover:text-emerald-300 transition inline-flex items-center gap-2"
    >
      View Project <span className="text-xl">→</span>
    </a>
  );
}

function TeamMemberCard({ name, role, image, links }: TeamMemberProps) {
  return (
    <div className="bg-emerald-800/30 p-6 backdrop-blur-sm border border-emerald-700/30">
      <TeamMemberInfo name={name} role={role} image={image} />
      <TeamMemberLinks links={links} />
    </div>
  );
}

function TeamMemberInfo({ name, role, image }: Omit<TeamMemberProps, 'links'>) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="w-16 h-16 overflow-hidden border border-emerald-700/30">
        <img
          src={image || "/api/placeholder/64/64"}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <div>
        <h3 className="text-xl font-semibold">{name}</h3>
        <p className="text-emerald-300">{role}</p>
      </div>
    </div>
  );
}

function TeamMemberLinks({ links }: { links: SocialLink[] }) {
  return (
    <div className="flex gap-3">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          className="p-2 bg-emerald-900/50 hover:bg-emerald-900/70 transition border border-emerald-700/30"
          title={link.type}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}

function ProjectsSection() {
  const projects: ProjectProps[] = [
    {
      title: "FaceSwap",
      description: "Our fast and in-house solution for face swapping. Designed with accessibility and ease of use in mind.",
      technologies: [
        { name: "React", icon: <Si.SiReact size={16} /> },
        { name: "Node.js", icon: <Si.SiNodedotjs size={16} /> },
        { name: "Python", icon: <Si.SiPython size={16} /> },
        { name: "ONNX", icon: <Si.SiOnnx size={16} /> },
        { name: "FastAPI", icon: <Si.SiFastapi size={16} /> }
      ],
      image: "/api/placeholder/640/360",
      link: "https://faceswap.smartfellas.us"
    },
  ];

  return (
    <div className="mt-64" id="projects">
      <h2 className="text-2xl font-semibold mb-8">Our Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <ProjectCard key={index} {...project} />
        ))}
      </div>
    </div>
  );
}

function TeamProfiles() {
  const teamMembers: TeamMemberProps[] = [
    {
      name: "Ben Teng",
      role: "Backend Developer",
      image: "/api/placeholder/64/64",
      links: [
        { type: "Github", url: "https://github.com/satedgami", icon: <Si.SiGithub size={20} /> },
        { type: "Email", url: "mailto:btpbenmrkin@gmail.com", icon: <Mail size={20} /> }
      ]
    },
    {
      name: "Pravin Ramana",
      role: "Full Stack Developer",
      image: "/api/placeholder/64/64",
      links: [
        { type: "Github", url: "https://github.com/pravinxor", icon: <Si.SiGithub size={20} /> },
        { type: "Email", url: "mailto:pravinramana25@protonmail.ch", icon: <Mail size={20} /> }
      ]
    },
    {
      name: "Joshua Cox",
      role: "Full Stack Developer",
      image: "/api/placeholder/64/64",
      links: [
        { type: "Github", url: "https://github.com/qwed81", icon: <Si.SiGithub size={20} /> },
        { type: "Email", url: "#", icon: <Mail size={20} /> }
      ]
    },
  ];

  return (
    <div className="mt-64" id="team">
      <h2 className="text-2xl font-semibold mb-8">Meet Our Team</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member, index) => (
          <TeamMemberCard key={index} {...member} />
        ))}
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    // <h2 className="text-6xl font-bold leading-tight">
    //   We develop software
    //   {' '}<span className="text-emerald-400 font-serif italic">across the stack</span>{' '}
    //   and are ready for any challenge
    // </h2>
    <h2 className="text-6xl font-bold leading-tight">
      You're either a
      {' '}<span className="text-emerald-400 font-serif italic">smart fella</span>{' '}
      or a
      {' '}<span className="text-emerald-400 font-serif italic">fart smella</span>{' '}
    </h2>
  );
}

function CTASection() {
  return (
    <div className="mt-32">
      <a
        href="#contact"
        className="inline-flex items-center gap-2 bg-emerald-400 text-emerald-900 px-6 py-3 font-medium hover:bg-emerald-300 transition border border-emerald-500"
      >
        Get in touch
        <span className="text-xl">→</span>
      </a>
    </div>
  );
}

function App() {
  const [activeSection, setActiveSection] = useState<string>('');

  const sections: Section[] = [
    {
      id: 'team',
      label: 'Team',
      Component: TeamProfiles
    },
    {
      id: 'projects',
      label: 'Projects',
      Component: ProjectsSection
    }
  ];

  useEffect(() => {
    function handleScroll() {
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      let isInSection = false;

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { top } = element.getBoundingClientRect();
          const elementPosition = top + window.scrollY;

          if (scrollPosition >= elementPosition && scrollPosition < elementPosition + element.offsetHeight) {
            setActiveSection(section.id);
            isInSection = true;
            break;
          }
        }
      }

      if (!isInSection) {
        setActiveSection('');
      }
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  return (
    <div className="min-h-screen bg-emerald-900 text-white p-8">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-emerald-900/30 backdrop-blur-md">
        <div className="flex justify-between items-center px-8 py-8">
          <Logo />
          <NavigationPill sections={sections} activeSection={activeSection} />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto mt-32">
        <HeroSection />
        {sections.map(({ id, Component }) => (
          <Component key={id} />
        ))}
        <CTASection />
      </main>
    </div>
  );
}

// Root Render
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

export default App;
