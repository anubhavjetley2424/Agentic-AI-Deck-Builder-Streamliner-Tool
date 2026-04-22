import { Link } from 'react-router-dom'
import Container from '../ui/Container'

const RED = '#DC3545'

export default function Footer() {
  return (
    <footer style={{ background: '#080808', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <Container className="py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-14">
          <div>
            <span className="font-sans text-2xl font-semibold tracking-[0.04em] text-white block mb-4">
              Deck<span className="font-light italic" style={{ color: RED }}>Forge</span>
            </span>
            <p className="text-sm text-white/30 leading-relaxed max-w-xs">
              AI-powered deck design. Upload your plan, craft your vision, let our agents build the blueprint.
            </p>
          </div>

          <div>
            <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] mb-5" style={{ color: `${RED}AA` }}>Navigate</h4>
            <ul className="space-y-3">
              {[
                { to: '/', label: 'Home' },
                { to: '/workshop', label: 'Workshop' },
                { to: '/gallery', label: 'Gallery' },
                { to: '/about', label: 'About' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-white/35 hover:text-white transition-colors duration-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] mb-5" style={{ color: `${RED}AA` }}>Technology</h4>
            <ul className="space-y-3 text-sm text-white/35">
              <li>Multi-Agent System (CrewAI)</li>
              <li>Revit MCP Integration</li>
              <li>Blender 3D Visualization</li>
              <li>React + TypeScript</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} DeckForge. All rights reserved.</p>
          <p className="text-xs text-white/20">Powered by Revit MCP + CrewAI</p>
        </div>
      </Container>
    </footer>
  )
}
