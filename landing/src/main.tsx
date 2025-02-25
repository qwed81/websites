import { StrictMode } from 'react'
import * as Si from '@icons-pack/react-simple-icons'
import React, { useState, useEffect, useRef } from 'react';
import { Mail } from 'lucide-react';
import { createRoot } from 'react-dom/client'
import { motion, useInView, useAnimation } from 'framer-motion';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6
    }
  }
};

function Logo() {
  return (
    <motion.div
      className="flex items-center gap-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-xl text-slate-100 font-semibold">SmartFellas</h1>
    </motion.div>
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
    <motion.div
      ref={navRef}
      className="relative flex bg-gray-800/30 py-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <NavigationBackground pillStyle={pillStyle} />
      <NavigationLinks sections={sections} activeSection={activeSection} />
    </motion.div>
  );
}

function NavigationBackground({ pillStyle }: { pillStyle: { left: number; width: number } }) {
  return (
    <motion.div
      className={`absolute bg-slate-900/50 transition-all duration-300 ease-in-out ${pillStyle.width === 0 ? 'opacity-0' : 'opacity-100'}`}
      style={{
        left: pillStyle.left,
        width: pillStyle.width,
        top: '50%',
        transform: 'translateY(-50%)'
      }}
      layout
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
          className={`px-4 py-1 relative z-10 transition-colors duration-300 ${activeSection === section.id ? 'text-slate-400' : 'hover:text-slate-300'}`}
        >
          {section.label}
        </a>
      ))}
    </>
  );
}

function AnimatedSection({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
}

function ProjectCard({ title, description, technologies, image, link }: ProjectProps) {
  return (
    <motion.div
      className="bg-slate-800/30 p-6 backdrop-blur-sm border border-slate-700/30"
      variants={itemVariants}
    >
      <ProjectImage title={title} image={image} />
      <ProjectInfo title={title} description={description} />
      <TechnologyTags technologies={technologies} />
      <ProjectLink link={link} />
    </motion.div>
  );
}

function ProjectImage({ title, image }: { title: string; image?: string }) {
  return (
    <div className="aspect-video overflow-hidden mb-4 bg-slate-900/50">
      <motion.img
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
      <p className="text-slate-100/80 mb-4">{description}</p>
    </>
  );
}

function TechnologyTags({ technologies }: { technologies: Technology[] }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {technologies.map((tech, index) => (
        <motion.span
          key={index}
          className="px-3 py-1 bg-slate-900/50 text-sm text-slate-300 border border-slate-700/30 flex items-center gap-2"
        >
          {tech.icon}
          {tech.name}
        </motion.span>
      ))}
    </div>
  );
}

function ProjectLink({ link }: { link?: string }) {
  if (!link) return null;

  return (
    <motion.a
      href={link}
      className="text-slate-400 hover:text-slate-300 transition inline-flex items-center gap-2"
    >
      View Project <span className="text-xl">→</span>
    </motion.a>
  );
}

function TeamMemberCard({ name, role, image, links }: TeamMemberProps) {
  return (
    <motion.div
      className="bg-slate-800/30 p-6 backdrop-blur-sm border border-slate-700/30"
      variants={itemVariants}
    >
      <TeamMemberInfo name={name} role={role} image={image} />
      <TeamMemberLinks links={links} />
    </motion.div>
  );
}

function TeamMemberInfo({ name, role, image }: Omit<TeamMemberProps, 'links'>) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <motion.div
        className="w-16 h-16 overflow-hidden border border-slate-700/30"
      >
        <img
          src={image || "/api/placeholder/64/64"}
          alt={name}
          className="w-full h-full object-cover"
        />
      </motion.div>
      <div>
        <h3 className="text-xl font-semibold">{name}</h3>
        <p className="text-slate-300">{role}</p>
      </div>
    </div>
  );
}

function TeamMemberLinks({ links }: { links: SocialLink[] }) {
  return (
    <div className="flex gap-3">
      {links.map((link, index) => (
        <motion.a
          key={index}
          href={link.url}
          className="p-2 bg-slate-900/50 hover:bg-slate-900/70 transition border border-slate-700/30"
          title={link.type}
        >
          {link.icon}
        </motion.a>
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
      image: "/faceswap.jpeg",
      link: "https://faceswap.smartfellas.us"
    },
  ];

  return (
    <div className="mt-32" id="projects">
      <motion.h2
        className="text-2xl font-semibold mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Our Projects
      </motion.h2>
      <AnimatedSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <ProjectCard key={index} {...project} />
          ))}
        </div>
      </AnimatedSection>
    </div>
  );
}

function TeamProfiles() {
  const teamMembers: TeamMemberProps[] = [
    {
      name: "Ben Teng",
      role: "Backend Developer",
      image: "/benprofile.jpeg",
      links: [
        { type: "Github", url: "https://github.com/satedgami", icon: <Si.SiGithub size={20} /> },
        { type: "Email", url: "mailto:btpbenmrkin@gmail.com", icon: <Mail size={20} /> }
      ]
    },
    {
      name: "Pravin Ramana",
      role: "Full Stack Developer",
      image: "/pravinprofile.jpeg",
      links: [
        { type: "Github", url: "https://github.com/pravinxor", icon: <Si.SiGithub size={20} /> },
        { type: "Email", url: "mailto:pravinramana25@protonmail.ch", icon: <Mail size={20} /> }
      ]
    },
    {
      name: "Joshua Cox",
      role: "Full Stack Developer",
      image: "/joshprofile.jpeg",
      links: [
        { type: "Github", url: "https://github.com/qwed81", icon: <Si.SiGithub size={20} /> },
        { type: "Email", url: "mailto:jcox.12.2002@gmail.com", icon: <Mail size={20} /> }
      ]
    },
  ];

  return (
    <div className="mt-32" id="team">
      <motion.h2
        className="text-2xl font-semibold mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Meet Our Team
      </motion.h2>
      <AnimatedSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member, index) => (
            <TeamMemberCard key={index} {...member} />
          ))}
        </div>
      </AnimatedSection>
    </div>
  );
}


const HeroSection: React.FC = () => {
  interface AnimationProps {
    initial: { opacity: number; y?: number };
    animate: { opacity: number; y?: number };
    transition: { duration: number; delay?: number };
  }

  const containerAnimation: AnimationProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.8 }
  };

  const itemAnimation = (delay: number): AnimationProps => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay }
  });

  return (
    <div>
      <motion.h2
        className="text-6xl font-bold leading-tight"
        {...containerAnimation}
      >
        <motion.span {...itemAnimation(0.2)}>
          Smart
        </motion.span>{' '}
        <motion.span
          className="text-slate-400 font-serif italic"
          {...itemAnimation(0.5)}
        >
          Work
        </motion.span>
        <motion.span {...itemAnimation(0.8)}>
          , Smart
        </motion.span>{' '}
        <motion.span
          className="text-slate-400 font-serif italic"
          {...itemAnimation(1.1)}
        >
          Results
        </motion.span>
        <motion.span {...itemAnimation(1.4)}>
          , Smart
        </motion.span>{' '}
        <motion.span
          className="text-slate-400 font-serif italic"
          {...itemAnimation(1.7)}
        >
          Fellas
        </motion.span>
      </motion.h2>
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
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/30 backdrop-blur-md">
        <div className="flex justify-between items-center px-8 py-8">
          <Logo />
          <NavigationPill sections={sections} activeSection={activeSection} />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto mt-32">
        <HeroSection />
        {sections.map(({ id, Component }) => (
          <Component key={id} />
        ))}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

export default App;
