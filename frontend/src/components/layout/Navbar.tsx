import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Container from '../ui/Container'
import { cn } from '../../lib/utils'

const links = [
  { to: '/', label: 'Home' },
  { to: '/workshop', label: 'Workshop' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
]

const RED = '#DC3545'

export default function Navbar() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [pastHero, setPastHero] = useState(false)
  const isHome = pathname === '/'

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40)
      // On home, hide navbar once user scrolls past the hero section
      // (hero is a 220vh pinned section; we treat "past hero" as > 1.25vh)
      if (isHome) {
        setPastHero(window.scrollY > window.innerHeight * 1.25)
      } else {
        setPastHero(false)
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  const navBg = isHome && !scrolled
    ? 'bg-transparent'
    : 'glass border-b border-white/[0.06]'

  // On home, once we're past the hero, slide the navbar out so other sections go full-screen
  const hiddenClass = isHome && pastHero
    ? '-translate-y-full opacity-0 pointer-events-none'
    : 'translate-y-0 opacity-100'

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        navBg,
        hiddenClass,
      )}
    >
      <Container className="flex h-[72px] items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" aria-label="DeckForge — Home">
          {/* Blueprint mark: square + midline accent */}
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
            <rect x="2" y="2" width="22" height="22" stroke="white" strokeWidth="1.2" opacity="0.7" />
            <line x1="2" y1="13" x2="24" y2="13" stroke={RED} strokeWidth="1.4" />
            <rect x="7" y="7" width="12" height="6" stroke={RED} strokeWidth="1" opacity="0.85" fill="none" />
          </svg>
          <span className="sr-only">DeckForge</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                'font-mono text-[11px] font-medium uppercase tracking-[0.15em] transition-colors duration-300',
                pathname === l.to ? 'text-white' : 'text-white/35 hover:text-white/65',
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            to="/workshop"
            className="inline-flex items-center h-9 px-5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(220,53,69,0.35)]"
            style={{
              background: RED,
              clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
            }}
          >
            Start Design
          </Link>
        </div>

        <button
          className="md:hidden p-2 text-white/80 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </Container>

      {open && (
        <div className="md:hidden bg-black/95 border-t border-white/[0.06] px-4 pb-4 pt-2 space-y-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={cn(
                'block py-3 px-4 font-mono text-[11px] font-medium uppercase tracking-[0.15em]',
                pathname === l.to ? 'text-white bg-white/[0.06]' : 'text-white/40 hover:text-white',
              )}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2 px-4">
            <Link
              to="/workshop"
              onClick={() => setOpen(false)}
              className="block w-full text-center py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-white"
              style={{ background: RED }}
            >
              Start Design
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
