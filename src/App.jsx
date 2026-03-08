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

function App() {
  // Scroll-reveal with IntersectionObserver
  useEffect(() => {
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
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
    };
  }, []);

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
