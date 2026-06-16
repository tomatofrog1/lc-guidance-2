import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopAppBar from "./TopAppBar";
import FileNewCaseModal from "./FileNewCaseModal";

interface LayoutProps {
  children: ReactNode;
  title: string;
  pageKey: string;
}

export default function Layout({ children, title, pageKey }: LayoutProps) {
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <div className="bg-background text-on-background font-body-md text-body-md antialiased min-h-screen overflow-x-hidden">
      <Sidebar />
      <TopAppBar title={title} onNewCaseClick={() => setIsNewCaseModalOpen(true)} />
      <main className="ml-sidebar-width min-h-[calc(100vh-64px)] p-margin-page max-w-[1440px] mx-auto flex flex-col gap-gutter pb-12">
        <div key={pageKey} className="page-transition flex flex-col gap-gutter">
          {children}
        </div>
      </main>
      <FileNewCaseModal
        isOpen={isNewCaseModalOpen}
        onClose={() => setIsNewCaseModalOpen(false)}
      />
    </div>
  );
}
