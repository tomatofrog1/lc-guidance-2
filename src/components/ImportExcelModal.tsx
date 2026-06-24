import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { openPath } from "@tauri-apps/plugin-opener";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

export interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void; // Keeping it for backward compatibility if needed, though we navigate away.
}

export default function ImportExcelModal({ isOpen, onClose }: ImportExcelModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      setIsLoading(true);
      const filePath = await invoke<string>("generate_import_template");
      await openPath(filePath);
    } catch (e) {
      alert(`Failed to generate template: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Excel", extensions: ["xlsx", "csv"] }]
      });

      if (selected === null) return;
      
      setIsLoading(true);
      // Wait, we need the filename from `selected`. `selected` is an absolute path.
      // We can extract filename by splitting by '/' or '\'.
      const filename = selected.replace(/^.*[\\\/]/, '');

      const result = await invoke<any>("parse_import_file", { filePath: selected });
      
      onClose(); // Close modal
      
      // Navigate to review page
      navigate("/import-review", { state: { parseResult: result, filename } });

    } catch (e) {
      alert(`Failed to parse file: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-surface rounded-3xl w-full max-w-md shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-5 border-b border-outline-variant bg-surface-container-low">
          <h2 className="text-xl font-semibold text-on-surface">Import Cases</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-on-surface-variant">
              Import a batch of cases using an Excel (.xlsx) or CSV file. Please ensure your file follows the required format.
            </p>
            <div className="flex flex-col gap-3 mt-4">
              <button
                onClick={handleSelectFile}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">{isLoading ? "hourglass_empty" : "upload_file"}</span>
                {isLoading ? "Parsing File..." : "Select File"}
              </button>
              <button
                onClick={handleDownloadTemplate}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-surface-container border border-outline-variant text-on-surface rounded-xl font-medium hover:bg-surface-variant transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">download</span>
                Download Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
