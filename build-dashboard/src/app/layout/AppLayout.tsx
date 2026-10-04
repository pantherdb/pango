import { NavLink, Outlet } from 'react-router-dom'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-2 py-1 text-sm no-underline ${isActive ? 'bg-white/15 text-white' : 'text-primary-100 hover:text-white'}`

/**
 * The frame: the pango bar, then the page. Wide on purpose: build records are columns of figures
 * and timelines, which read better at 1600 px than in a narrow centred column.
 */
const AppLayout = () => (
  <div className="flex min-h-screen flex-col">
    <header className="bg-primary-500">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
        <NavLink
          to="/"
          className="text-base font-semibold text-white no-underline hover:text-accent-300"
        >
          PAN-GO builds
        </NavLink>
        <span className="text-xs text-primary-100">
          what each loader build did, and what is live
        </span>
        <nav aria-label="Main" className="ml-auto flex gap-1">
          <NavLink to="/" end className={navClass}>
            Builds
          </NavLink>
          <NavLink to="/live" className={navClass}>
            Environments
          </NavLink>
        </nav>
      </div>
    </header>
    <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-4">
      <Outlet />
    </main>
  </div>
)

export default AppLayout
