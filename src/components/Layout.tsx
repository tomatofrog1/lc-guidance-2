import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import TopAppBar from "./TopAppBar";
import FileNewCaseModal from "./FileNewCaseModal";

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);

  return (
    <div className="bg-background text-on-background font-body-md text-body-md antialiased min-h-screen">
      <Sidebar />
      <TopAppBar title={title} onNewCaseClick={() => setIsNewCaseModalOpen(true)} />
      <main className="ml-sidebar-width min-h-[calc(100vh-64px)] p-margin-page max-w-[1440px] mx-auto flex flex-col gap-gutter pb-12">
        {children}
      </main>
      <FileNewCaseModal 
        isOpen={isNewCaseModalOpen} 
        onClose={() => setIsNewCaseModalOpen(false)} 
      />
    </div>
  );
}
