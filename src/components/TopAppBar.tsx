import { Link } from "react-router-dom";

interface TopAppBarProps {
  title: string;
  onNewCaseClick?: () => void;
}

export default function TopAppBar({ title, onNewCaseClick }: TopAppBarProps) {
  return (
    <header className="full-width h-16 sticky top-0 bg-surface-bright dark:bg-surface-container border-b border-outline-variant dark:border-on-surface-variant flex items-center justify-between px-margin-page ml-sidebar-width w-[calc(100%-240px)] z-10 transition-all duration-150 ease-in-out">
      <div className="flex items-center gap-4">
        {title !== "Summary & Reports" && title !== "Guidance Office" && (
          <Link to={-1 as any} className="text-secondary hover:text-primary transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
        )}
        <h2 className="font-section-header text-section-header text-primary dark:text-primary-fixed-dim font-bold">{title}</h2>
        {title === "Guidance Office" && (
          <div className="relative flex items-center w-96 ml-8">
            <span className="material-symbols-outlined text-secondary absolute left-3" style={{ fontSize: '20px' }}>search</span>
            <input 
              type="text" 
              placeholder="Search Case ID or Name..." 
              className="w-full pl-10 pr-4 py-2 bg-surface-container border border-outline-variant rounded-full text-body-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {title === "Summary & Reports" && (
          <div className="relative flex items-center bg-surface border border-outline-variant rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
            <span className="material-symbols-outlined text-secondary pl-3" style={{ fontSize: '20px' }}>calendar_today</span>
            <select className="pl-2 pr-8 py-1.5 border-none bg-transparent text-body-md font-body-md text-on-surface-variant focus:ring-0 appearance-none cursor-pointer">
              <option>Last 30 Days</option>
              <option>This Semester</option>
              <option>Academic Year</option>
              <option>All Time</option>
            </select>
            <span className="material-symbols-outlined text-secondary absolute right-2 pointer-events-none" style={{ fontSize: '20px' }}>arrow_drop_down</span>
          </div>
        )}

        <button className="p-2 text-secondary hover:text-primary dark:hover:text-primary-fixed-dim transition-all rounded-full hover:bg-surface-container">
          <span className="material-symbols-outlined">filter_list</span>
        </button>
        <button className="p-2 text-secondary hover:text-primary dark:hover:text-primary-fixed-dim transition-all rounded-full hover:bg-surface-container">
          <span className="material-symbols-outlined">settings</span>
        </button>
        {title !== "Summary & Reports" && (
          <button onClick={onNewCaseClick} className="bg-primary text-white px-4 py-2 rounded-DEFAULT font-body-md text-body-md font-medium hover:bg-on-primary-fixed-variant transition-colors ml-2">
            + New Case
          </button>
        )}
      </div>
    </header>
  );
}
