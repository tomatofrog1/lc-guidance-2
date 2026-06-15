import { Link, useLocation } from "react-router-dom";
import { useDarkMode } from "../hooks/useDarkMode";

export default function Sidebar() {
  const location = useLocation();
  const { isDark, toggleDarkMode } = useDarkMode();

  const getLinkClasses = (path: string) => {
    const isActive = location.pathname === path;
    const baseClasses = "flex items-center gap-3 px-4 py-3 rounded-DEFAULT transition-colors duration-200 cursor-pointer active:scale-95";
    
    if (isActive) {
      return `${baseClasses} rounded-r-DEFAULT -ml-4 pl-8 bg-surface-lowest text-primary dark:text-on-primary-container border-l-4 border-primary dark:border-primary-fixed-dim font-semibold bg-surface shadow-sm`;
    }
    
    return `${baseClasses} text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container dark:hover:bg-surface-container-high`;
  };

  const getIconFill = (path: string) => {
    return location.pathname === path ? 1 : 0;
  };

  return (
    <nav className="w-sidebar-width h-screen fixed left-0 top-0 bg-surface dark:bg-surface-dim border-r border-outline-variant dark:border-on-surface-variant flex flex-col py-stack-md z-20">
      <div className="px-gutter mb-8 mt-4">
        <h1 className="font-display-title text-display-title text-primary dark:text-primary-fixed-dim">Laguna College</h1>
        <p className="font-label-caps text-label-caps text-secondary dark:text-secondary-fixed-dim mt-1 tracking-wider">GUIDANCE OFFICE</p>
      </div>
      
      <div className="flex-grow flex flex-col gap-1 px-4">
        <Link to="/catalog" className={getLinkClasses("/catalog")}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${getIconFill("/catalog")}` }}>folder_open</span>
          <span className="font-body-md text-body-md font-medium">Case Catalog</span>
        </Link>
        <Link to="/new" className={getLinkClasses("/new")}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${getIconFill("/new")}` }}>add_box</span>
          <span className="font-body-md text-body-md font-medium">File New Case</span>
        </Link>
        <Link to="/" className={getLinkClasses("/")}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${getIconFill("/")}` }}>assessment</span>
          <span className="font-body-md text-body-md font-medium">Summary & Reports</span>
        </Link>
      </div>

      <div className="mt-auto px-4 flex flex-col gap-1 border-t border-surface-variant pt-4 mx-4">
        <button 
          onClick={toggleDarkMode}
          className="flex items-center gap-3 px-4 py-3 rounded-DEFAULT text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors duration-200 cursor-pointer active:scale-95 w-full text-left"
        >
          <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
          <span className="font-body-md text-body-md font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button className="flex items-center gap-3 px-4 py-3 rounded-DEFAULT text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors duration-200 cursor-pointer active:scale-95 w-full text-left">
          <span className="material-symbols-outlined">account_circle</span>
          <span className="font-body-md text-body-md font-medium">Counselor Profile</span>
        </button>
      </div>
    </nav>
  );
}
