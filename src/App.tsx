import { useEffect, useRef, useState } from 'react'
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
import { useContent } from './context/useContent'
import { useLanguage } from './context/useLanguage'
import { useProfile } from './context/useProfile'

function App() {
  const { pathname } = useLocation()
  const isAdminRoute = pathname.startsWith('/admin')
  const { loading: languageLoading } = useLanguage()
  const { loading: profileLoading, refreshProfile } = useProfile()
  const {
    loading: contentLoading,
    projects,
    githubProjects,
    skillCategories,
    techStack,
    refreshContent,
  } = useContent()
  const previousPathnameRef = useRef(pathname)
  const [bootDelayDone, setBootDelayDone] = useState(false)

  const dataLoading = languageLoading || profileLoading || contentLoading
  const shouldGateHome = pathname === '/'

  useEffect(() => {
    if (dataLoading) return undefined
    const timeout = setTimeout(() => setBootDelayDone(true), 450)
    return () => clearTimeout(timeout)
  }, [dataLoading])

  useEffect(() => {
    if (!dataLoading || !bootDelayDone) return undefined
    const timeout = setTimeout(() => setBootDelayDone(false), 0)
    return () => clearTimeout(timeout)
  }, [dataLoading, bootDelayDone])

  const appLoading = shouldGateHome
    ? dataLoading || !bootDelayDone
    : dataLoading

  useEffect(() => {
    const previousPath = previousPathnameRef.current
    if (pathname === '/' && previousPath !== '/') {
      refreshProfile()
      refreshContent()
    }
    previousPathnameRef.current = pathname
  }, [pathname, refreshProfile, refreshContent])

  useEffect(() => {
    if (appLoading) return undefined

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
    appLoading,
    projects.length,
    githubProjects.length,
    skillCategories.length,
    techStack.length,
  ])

  if (appLoading) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <p>Caricamento contenuti...</p>
      </main>
    )
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
