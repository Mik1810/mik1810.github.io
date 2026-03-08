import { useEffect, useRef, useState } from 'react';
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
import AdminDashboard from './components/jsx/AdminDashboard';
import RequireAdmin from './components/jsx/RequireAdmin';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import { useProfile } from './context/ProfileContext';
import { useContent } from './context/ContentContext';

function App() {
  const { pathname } = useLocation();
  const { loading: languageLoading } = useLanguage();
  const { loading: profileLoading, profile, refreshProfile } = useProfile();
  const { loading: contentLoading, projects, skillCategories, techStack, refreshContent } =
    useContent();
  const previousPathnameRef = useRef(pathname);
  const [bootDelayDone, setBootDelayDone] = useState(false);

  const dataLoading = languageLoading || profileLoading || contentLoading;
  const heroReady = Boolean(profile?.name && Array.isArray(profile?.roles));
  const shouldGateHome = pathname === '/';

  useEffect(() => {
    if (dataLoading) {
      setBootDelayDone(false);
      return undefined;
    }
    const timeout = setTimeout(() => setBootDelayDone(true), 450);
    return () => clearTimeout(timeout);
  }, [dataLoading]);

  const appLoading = shouldGateHome
    ? dataLoading || !heroReady || !bootDelayDone
    : dataLoading;

  useEffect(() => {
    const previousPath = previousPathnameRef.current;
    if (pathname === '/' && previousPath !== '/') {
      refreshProfile();
      refreshContent();
    }
    previousPathnameRef.current = pathname;
  }, [pathname, refreshProfile, refreshContent]);

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
        <Route path="/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
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
