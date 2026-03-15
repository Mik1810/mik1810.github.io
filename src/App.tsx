import { useEffect, useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import About from './components/jsx/About'
import AdminDashboard from './components/jsx/AdminDashboard'
import AdminLogin from './components/jsx/AdminLogin'
import Contact from './components/jsx/Contact'
import Experience from './components/jsx/Experience'
import Footer from './components/jsx/Footer'
import HeroTyping from './components/jsx/HeroTyping'
import Navbar from './components/jsx/Navbar'
import Projects from './components/jsx/Projects'
import RequireAdmin from './components/jsx/RequireAdmin'
import ScrollProgress from './components/jsx/ScrollProgress'
import ScrollToTop from './components/jsx/ScrollToTop'
import Skills from './components/jsx/Skills'
import './components/css/SectionSkeletons.css'
import { useContent } from './context/useContent'
import { useProfile } from './context/useProfile'

function App() {
  const { pathname } = useLocation()
  const isAdminRoute = pathname.startsWith('/admin')
  const { refreshProfile } = useProfile()
  const {
    projects,
    githubProjects,
    skillCategories,
    techStack,
    refreshContent,
  } = useContent()
  const previousPathnameRef = useRef(pathname)

  useEffect(() => {
    const previousPath = previousPathnameRef.current
    if (pathname === '/' && previousPath !== '/') {
      refreshProfile()
      refreshContent()
    }
    previousPathnameRef.current = pathname
  }, [pathname, refreshProfile, refreshContent])

  useEffect(() => {
    if (pathname !== '/') return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    document.querySelectorAll('.reveal').forEach((el) => {
      if (!el.classList.contains('visible')) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [
    pathname,
    projects.length,
    githubProjects.length,
    skillCategories.length,
    techStack.length,
  ])

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
        <Route
          path="/"
          element={
            <main>
              <HeroTyping />
              <About />
              <Projects />
              <Experience />
              <Skills />
              <Contact />
            </main>
          }
        />
      </Routes>
      <Footer className={isAdminRoute ? 'footer-admin' : ''} />
      <ScrollToTop />
    </>
  )
}

export default App
