import { useEffect } from 'react';
import Navbar from './components/jsx/Navbar';
import HeroTyping from './components/jsx/HeroTyping';
import About from './components/jsx/About';
import Projects from './components/jsx/Projects';
import Experience from './components/jsx/Experience';
import Skills from './components/jsx/Skills';
import Contact from './components/jsx/Contact';
import Footer from './components/jsx/Footer';
import ScrollToTop from './components/jsx/ScrollToTop';
import ScrollProgress from './components/jsx/ScrollProgress';
import AdminLogin from './components/jsx/AdminLogin';
import { Routes, Route } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import { useProfile } from './context/ProfileContext';
import { useContent } from './context/ContentContext';

function App() {
  const { loading: languageLoading } = useLanguage();
  const { loading: profileLoading } = useProfile();
  const { loading: contentLoading, projects, skillCategories, techStack } =
    useContent();

  const appLoading = languageLoading || profileLoading || contentLoading;

  // Scroll-reveal with IntersectionObserver
  useEffect(() => {
    if (appLoading) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.reveal').forEach((el) => {
      if (!el.classList.contains('visible')) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [appLoading, projects.length, skillCategories.length, techStack.length]);

  if (appLoading) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <p>Caricamento contenuti...</p>
      </main>
    );
  }

  return (
    <>
      <ScrollProgress />
      <Navbar />
      <Routes>
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/" element={
          <main>
            <HeroTyping />
            <About />
            <Projects />
            <Experience />
            <Skills />
            <Contact />
          </main>
        } />
      </Routes>
      <Footer />
      <ScrollToTop />
    </>
  );
}

export default App;
