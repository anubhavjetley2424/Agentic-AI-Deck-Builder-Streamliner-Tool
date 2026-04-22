import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import Workshop from './pages/Workshop'
import Gallery from './pages/Gallery'
import About from './pages/About'

/* Wrap every route in a smooth fade so navigation never cuts abruptly. */
function PageFade({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ minHeight: '100%' }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()
  const { pathname } = location
  const hideFooter = pathname === '/workshop' || pathname === '/'
  const hideNavbar = pathname === '/workshop'

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {!hideNavbar && <Navbar />}
      <main className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={pathname}>
            <Route path="/" element={<PageFade><Home /></PageFade>} />
            <Route path="/workshop" element={<PageFade><Workshop /></PageFade>} />
            <Route path="/gallery" element={<PageFade><Gallery /></PageFade>} />
            <Route path="/about" element={<PageFade><About /></PageFade>} />
          </Routes>
        </AnimatePresence>
      </main>
      {!hideFooter && <Footer />}
    </div>
  )
}
