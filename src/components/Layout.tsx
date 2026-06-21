import { useEffect, useRef, useState, ReactNode } from "react";
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
  const [successToastMessage, setSuccessToastMessage] = useState("");
  const [isSuccessToastVisible, setIsSuccessToastVisible] = useState(false);
  const successToastTimerRef = useRef<number | null>(null);

  const showSuccessToast = (message: string) => {
    setSuccessToastMessage(message);
    setIsSuccessToastVisible(false);
    if (successToastTimerRef.current) window.clearTimeout(successToastTimerRef.current);
    window.requestAnimationFrame(() => setIsSuccessToastVisible(true));
    successToastTimerRef.current = window.setTimeout(() => {
      setIsSuccessToastVisible(false);
      window.setTimeout(() => setSuccessToastMessage(""), 180);
    }, 2800);
  };

  useEffect(() => {
    return () => {
      if (successToastTimerRef.current) window.clearTimeout(successToastTimerRef.current);
    };
  }, []);

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
        onCaseFiled={() => showSuccessToast("Case filed successfully.")}
      />
      {successToastMessage && (
        <div className={`fixed bottom-5 right-5 z-[70] flex items-start gap-2 rounded-xl border border-green-500/30 bg-green-50 px-4 py-3 text-green-900 shadow-xl transition-[transform,opacity] duration-200 ease-out ${isSuccessToastVisible ? "translate-x-0 opacity-100 case-toast-x-enter" : "translate-x-4 opacity-0"}`}>
          <span className="material-symbols-outlined text-green-600" style={{ fontSize: 18 }}>check_circle</span>
          <p className="text-xs font-bold">{successToastMessage}</p>
        </div>
      )}
    </div>
  );
}
