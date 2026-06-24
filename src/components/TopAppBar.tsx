import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface TopAppBarProps {
  title: string;
  onNewCaseClick?: () => void;
  isSidebarCollapsed?: boolean;
}

export default function TopAppBar({ title, onNewCaseClick, isSidebarCollapsed = false }: TopAppBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isCaseDetails = location.pathname.startsWith("/case/");
  const showBackButton = isCaseDetails;
  const showNewCaseButton = location.pathname === "/catalog" || location.pathname === "/pending";

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const checkPending = () => {
      try {
        const stored = localStorage.getItem("lc_pending_import_rows");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setPendingCount(parsed.length);
            return;
          }
        }
      } catch {}
      setPendingCount(0);
    };

    checkPending();
    window.addEventListener("storage", checkPending);
    window.addEventListener("focus", checkPending);
    return () => {
      window.removeEventListener("storage", checkPending);
      window.removeEventListener("focus", checkPending);
    };
  }, [location.pathname]);

  return (
    <header className={`app-topbar-surface h-16 sticky top-0 border-b border-outline-variant dark:border-on-surface-variant flex items-center justify-between px-margin-page min-w-0 z-10 transition-[background-color,border-color,margin-left] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
      isSidebarCollapsed ? "ml-[84px]" : "ml-[280px]"
    }`}>
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Link to={-1 as any} className="text-secondary hover:text-primary transition-colors duration-500">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
        )}
        <h2 className="font-section-header text-section-header text-primary dark:text-primary-fixed-dim font-bold">{title}</h2>

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
        {showNewCaseButton && (
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <button
                onClick={() => navigate("/import-review")}
                className="bg-[#FEF7E0] hover:bg-[#FEEFC3] text-[#B06000] border border-[#FEEFC3] px-3.5 py-2 rounded-lg font-body-md text-body-md font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                title="Click to resume pending imports review"
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>pending</span>
                {pendingCount} Pending {pendingCount === 1 ? "Import" : "Imports"}
              </button>
            )}
            <button onClick={onNewCaseClick} className="bg-primary text-white px-4 py-2 rounded-md font-body-md text-body-md font-medium hover:bg-on-primary-fixed-variant transition-colors duration-500 ml-2">
              + New Case
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
