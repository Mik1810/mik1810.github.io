import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Projects from './components/Projects';
import Experience from './components/Experience';
import Skills from './components/Skills';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Projects />
        <Experience />
        <Skills />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

export default App;
