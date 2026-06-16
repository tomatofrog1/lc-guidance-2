import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopAppBar from "./TopAppBar";
import FileNewCaseModal from "./FileNewCaseModal";

function getTitle(pathname: string) {
  if (pathname === "/") {
    return "Summary & Reports";
  }

  if (pathname.startsWith("/case")) {
    return "Case Details";
  }

  return "Guidance Office";
}

export default function Layout() {
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <div className="bg-background text-on-background font-body-md text-body-md antialiased min-h-screen overflow-x-hidden">
      <Sidebar />
      <TopAppBar title={title} onNewCaseClick={() => setIsNewCaseModalOpen(true)} />
      <main className="ml-sidebar-width min-w-0 min-h-[calc(100vh-64px)] p-margin-page max-w-[1440px] flex flex-col gap-gutter pb-12 overflow-x-clip">
        <div key={location.pathname} className="page-transition flex min-w-0 flex-col gap-gutter overflow-x-clip">
          <Outlet />
        </div>
      </main>
      <FileNewCaseModal 
        isOpen={isNewCaseModalOpen} 
        onClose={() => setIsNewCaseModalOpen(false)} 
      />
    </div>
  );
}
