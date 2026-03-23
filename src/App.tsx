import { lazy, Suspense, useEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import About from './components/jsx/About'
import Contact from './components/jsx/Contact'
import Experience from './components/jsx/Experience'
import AdminLogin from './components/jsx/AdminLogin'
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
    const returningFromAdmin =
      previousPath === '/login' || previousPath.startsWith('/admin')

    if (pathname === '/home' && previousPath !== '/home' && returningFromAdmin) {
      refreshProfile()
      refreshContent()
    }
    previousPathnameRef.current = pathname
  }, [pathname, refreshProfile, refreshContent])

  useEffect(() => {
    if (pathname !== '/home') return undefined

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
          element={<AdminLogin />}
        />
        <Route
          path="/admin"
          element={
            <Suspense fallback={null}>
              <AdminApp mode="home" />
            </Suspense>
          }
        />
        <Route
          path="/admin/tables"
          element={
            <Suspense fallback={null}>
              <AdminApp mode="tables" />
            </Suspense>
          }
        />
        <Route path="/admin/*" element={<AdminRouteNotFound />} />
        <Route
          path="/home"
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
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      <Footer className={isAdminRoute ? 'footer-admin' : ''} />
      <ScrollToTop />
    </>
  )
}

function AdminRouteNotFound() {
  return (
    <main className="section-loading-wrapper" aria-live="polite">
      <div className="section-loading-content">
        <h2>Admin route not found</h2>
        <p>The requested admin page does not exist.</p>
        <a href="/admin" className="navbar-login-btn" style={{ width: 'fit-content' }}>
          Back to admin home
        </a>
      </div>
    </main>
  )
}

export default App
