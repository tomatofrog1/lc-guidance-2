import { Link, useLocation } from "react-router-dom";
import { useDarkMode } from "../hooks/useDarkMode";
import lcLogo from "../assets/lc-logo.png";

export default function Sidebar() {
  const location = useLocation();
  const { isDark, toggleDarkMode } = useDarkMode();

  const navItems = [
    { path: "/pending", label: "Pending Cases", icon: "pending_actions", activePaths: ["/pending"] },
    { path: "/catalog", label: "Case Catalog", icon: "folder_open", activePaths: ["/catalog", "/case"] },
    { path: "/", label: "Summary & Reports", icon: "assessment", activePaths: ["/"] },
    { path: "/backup", label: "Backup", icon: "backup", activePaths: ["/backup"] },
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
    const baseClasses = "relative z-10 flex h-12 items-center gap-3 px-4 rounded-DEFAULT transition-[color,transform] duration-500 cursor-pointer active:scale-95";

    if (isActive) {
      return `${baseClasses} text-primary dark:text-on-primary-container font-semibold`;
    }

    return `${baseClasses} text-secondary dark:text-secondary-fixed-dim hover:text-primary dark:hover:text-primary-fixed-dim`;
  };

  const getIconFill = (index: number) => {
    return index === activeIndex ? 1 : 0;
  };

  return (
    <nav className="w-sidebar-width h-screen fixed left-0 top-0 bg-surface dark:bg-surface-dim border-r border-outline-variant dark:border-on-surface-variant flex flex-col py-stack-md z-20">
      <div className="px-5 mb-8 mt-4 flex items-center gap-4">
        <img src={lcLogo} alt="Laguna College Logo" className="w-16 h-16 object-contain shrink-0" />
        <div className="min-w-0">
          <h1 className="whitespace-nowrap text-[16px] leading-[18px] text-primary dark:text-primary-fixed-dim font-bold" style={{ fontFamily: "Georgia, serif" }}>Laguna College</h1>
          <p className="font-label-caps text-[11px] text-secondary dark:text-secondary-fixed-dim mt-1.5 tracking-wider leading-none">GUIDANCE OFFICE</p>
        </div>
      </div>

      <div className="relative flex-grow px-4">
        <div
          className="nav-active-indicator"
          style={{ transform: `translateY(${activeIndex * 52}px)` }}
        />
        <div className="relative flex flex-col gap-1">
          {navItems.map((item, index) => (
            <Link key={item.path} to={item.path} className={getLinkClasses(index)}>
              <span
                className="material-symbols-outlined transition-[font-variation-settings] duration-300"
                style={{ fontVariationSettings: `'FILL' ${getIconFill(index)}` }}
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
          <span className="material-symbols-outlined transition-colors duration-500">{isDark ? "light_mode" : "dark_mode"}</span>
          <span className="font-body-md text-body-md font-medium transition-colors duration-500">{isDark ? "Light Mode" : "Dark Mode"}</span>
        </button>
        <button className="flex items-center gap-3 px-4 py-3 rounded-DEFAULT text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors duration-500 cursor-pointer active:scale-95 w-full text-left">
          <span className="material-symbols-outlined transition-colors duration-500">account_circle</span>
          <span className="font-body-md text-body-md font-medium transition-colors duration-500">Counselor Profile</span>
        </button>
      </div>
    </nav>
  );
}
