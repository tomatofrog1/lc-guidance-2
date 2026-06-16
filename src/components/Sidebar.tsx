import { Link, useLocation } from "react-router-dom";
import { useDarkMode } from "../hooks/useDarkMode";

export default function Sidebar() {
  const location = useLocation();
  const { isDark, toggleDarkMode } = useDarkMode();
  const navItems = [
    { path: "/catalog", label: "Case Catalog", icon: "folder_open", activePaths: ["/catalog", "/case"] },
    { path: "/", label: "Summary & Reports", icon: "assessment", activePaths: ["/"] },
  ];

  const activeIndex = Math.max(
    navItems.findIndex((item) =>
      item.activePaths.some((path) =>
        path === "/" ? location.pathname === "/" : location.pathname.startsWith(path)
      )
    ),
    0
  );

  const getLinkClasses = (index: number) => {
    const isActive = index === activeIndex;
    const baseClasses = "nav-link relative z-10 flex h-12 items-center gap-3 px-4 rounded-DEFAULT cursor-pointer active:scale-[0.99]";

    if (isActive) {
      return `${baseClasses} text-primary dark:text-on-primary-container font-semibold`;
    }

    return `${baseClasses} text-secondary dark:text-secondary-fixed-dim hover:text-primary dark:hover:text-primary-fixed-dim hover:bg-surface-container-low dark:hover:bg-surface-container-high`;
  };

  const getIconFill = (index: number) => {
    return index === activeIndex ? 1 : 0;
  };

  return (
    <nav className="w-sidebar-width h-screen fixed left-0 top-0 bg-surface dark:bg-surface-dim border-r border-outline-variant dark:border-on-surface-variant flex flex-col py-stack-md z-20">
      <div className="px-gutter mb-8 mt-4">
        <h1 className="font-display-title text-display-title text-primary dark:text-primary-fixed-dim">Laguna College</h1>
        <p className="font-label-caps text-label-caps text-secondary dark:text-secondary-fixed-dim mt-1 tracking-wider">GUIDANCE OFFICE</p>
      </div>
      
      <div className="relative flex-grow px-4">
        <div
          className="nav-active-indicator"
          style={{ transform: `translateY(${activeIndex * 52}px)` }}
        >
          <span key={activeIndex} className="nav-active-fill" />
        </div>
        <div className="relative flex flex-col gap-1">
          {navItems.map((item, index) => (
            <Link key={item.path} to={item.path} className={getLinkClasses(index)}>
              <span
                className="material-symbols-outlined nav-icon"
                style={{ fontVariationSettings: `'FILL' ${getIconFill(index)}, 'wght' ${index === activeIndex ? 600 : 400}` }}
              >
                {item.icon}
              </span>
              <span className="font-body-md text-body-md font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-auto px-4 flex flex-col gap-1 border-t border-surface-variant pt-4 mx-4">
        <button 
          onClick={toggleDarkMode}
          className="flex items-center gap-3 px-4 py-3 rounded-DEFAULT text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors duration-500 cursor-pointer active:scale-95 w-full text-left"
        >
          <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
          <span className="font-body-md text-body-md font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button className="flex items-center gap-3 px-4 py-3 rounded-DEFAULT text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors duration-500 cursor-pointer active:scale-95 w-full text-left">
          <span className="material-symbols-outlined">account_circle</span>
          <span className="font-body-md text-body-md font-medium">Counselor Profile</span>
        </button>
      </div>
    </nav>
  );
}
