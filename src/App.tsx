import { lazy, Suspense, useEffect, useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import About from './components/jsx/About'
import Contact from './components/jsx/Contact'
import Experience from './components/jsx/Experience'
import Footer from './components/jsx/Footer'
import HeroTyping from './components/jsx/HeroTyping'
import Navbar from './components/jsx/Navbar'
import Projects from './components/jsx/Projects'
import ScrollProgress from './components/jsx/ScrollProgress'
import ScrollToTop from './components/jsx/ScrollToTop'
import Skills from './components/jsx/Skills'
import './components/css/SectionSkeletons.css'
import { useContent } from './context/useContent'
import { useProfile } from './context/useProfile'

const AdminApp = lazy(() => import('./components/jsx/AdminApp'))

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
      {!isAdminRoute && <ScrollProgress />}
      <Navbar />
      <Routes>
        <Route
          path="/login"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <AdminApp mode="login" />
            </Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <AdminApp mode="home" />
            </Suspense>
          }
        />
        <Route
          path="/admin/tables"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <AdminApp mode="tables" />
            </Suspense>
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

function AdminRouteFallback() {
  return (
    <main
      className="section-loading-wrapper"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="section-loading-content">
        <span className="section-loading-line section-loading-line-title" />
        <span className="section-loading-line section-loading-line-copy" />
      </div>
    </main>
  )
}

export default App
