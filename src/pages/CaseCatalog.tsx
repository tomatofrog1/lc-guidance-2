import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import DatePicker from "../components/DatePicker";
import * as XLSX from "xlsx";

interface StudentInfo {
  firstName: string;
  lastName: string;
  middleInitial: string;
  level: string;
  section: string;
  adviser: string;
}

interface CaseRecord {
  id: number;
  students: string;
  date: string;
  date_filed: string;
  case: string;
  description: string;
  sanction: string;
  progress: string;
}

const formatCaseId = (id: number) => `#${id.toString().padStart(4, "0")}`;
const CASES_PER_PAGE = 20;
const ELLIPSIS = "...";
const MODAL_EXIT_MS = 200;

const parseStudents = (studentsStr: string): StudentInfo[] => {
  try {
    return JSON.parse(studentsStr) || [];
  } catch (e) {
    return [];
  }
};

const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatIncidentDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const parsed = new Date(dateStr);

  if (Number.isNaN(parsed.getTime())) {
    return dateStr;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatRelativeFiled = (dateStr: string) => {
  if (!dateStr) return { primary: "—", secondary: "" };
  const parsed = new Date(dateStr);

  if (Number.isNaN(parsed.getTime())) {
    return { primary: dateStr, secondary: "" };
  }

  const today = new Date();
  const todayZero = new Date(today);
  todayZero.setHours(0, 0, 0, 0);
  const parsedZero = new Date(parsed);
  parsedZero.setHours(0, 0, 0, 0);

  const diffTime = todayZero.getTime() - parsedZero.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const timeFormatted = parsed.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());
    return {
      primary: "Today",
      secondary: timeFormatted,
    };
  } else if (diffDays === 1) {
    const timeFormatted = parsed.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());
    return {
      primary: "Yesterday",
      secondary: timeFormatted,
    };
  } else {
    const dateFormatted = parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return {
      primary: `${diffDays} days ago`,
      secondary: dateFormatted,
    };
  }
};

const isResolved = (progress: string) => progress.toLowerCase() === "resolved";
const isPending = (progress: string) => progress.toLowerCase() === "pending";
const isReprimand = (caseRecord: CaseRecord) =>
  caseRecord.sanction.toLowerCase().includes("reprimand") ||
  caseRecord.progress.toLowerCase().includes("reprimand");

const getBadgeClass = (progress: string) => {
  const normalizedProgress = progress.toLowerCase();

  if (normalizedProgress === "resolved") {
    return "badge-resolved";
  }

  if (normalizedProgress.includes("reprimand")) {
    return "badge-reprimand";
  }

  return "badge-pending";
};

export default function CaseCatalog() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date_filed" | "date">("date_filed");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleteConfirmClosing, setIsDeleteConfirmClosing] = useState(false);
  const todayDate = getTodayDateString();

  const loadCases = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedCases = await invoke<CaseRecord[]>("get_cases");
      setCases(loadedCases);
      setError(null);
    } catch (err) {
      setCases([]);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    window.addEventListener("cases:changed", loadCases);
    return () => {
      window.removeEventListener("cases:changed", loadCases);
    };
  }, [loadCases]);

  const stats = useMemo(() => {
    return {
      totalCases: cases.length,
      pendingReview: cases.filter((caseRecord) => isPending(caseRecord.progress)).length,
      resolvedAllTime: cases.filter((caseRecord) => isResolved(caseRecord.progress)).length,
      reprimandedCases: cases.filter(isReprimand).length,
    };
  }, [cases]);

  const filteredAndSortedCases = useMemo(() => {
    let result = cases;

    // Search query filter (search Case ID or Name or case type)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => {
        const idStr = `#${c.id.toString().padStart(4, "0")}`;
        const students = parseStudents(c.students);
        const matchesStudent = students.some(s => {
          const nameStr = `${s.firstName} ${s.middleInitial} ${s.lastName}`.toLowerCase();
          return s.firstName.toLowerCase().includes(q) ||
                 s.lastName.toLowerCase().includes(q) ||
                 s.middleInitial.toLowerCase().includes(q) ||
                 nameStr.includes(q) ||
                 (s.adviser && s.adviser.toLowerCase().includes(q));
        });

        return (
          idStr.toLowerCase().includes(q) ||
          c.case.toLowerCase().includes(q) ||
          matchesStudent
        );
      });
    }



    if (statusFilter !== "All Statuses") {
      result = result.filter(c => {
        if (statusFilter === "Pending") return isPending(c.progress);
        if (statusFilter === "Resolved") return isResolved(c.progress);
        if (statusFilter === "Reprimand") return isReprimand(c);
        return true;
      });
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter((c) => {
        const dateVal = new Date(c.date_filed || c.date);
        return dateVal >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((c) => {
        const dateVal = new Date(c.date_filed || c.date);
        return dateVal <= end;
      });
    }

    result = [...result].sort((a, b) => {
      const dateA = new Date(sortBy === "date_filed" ? (a.date_filed || a.date) : a.date).getTime();
      const dateB = new Date(sortBy === "date_filed" ? (b.date_filed || b.date) : b.date).getTime();
      
      if (sortOrder === "asc") return dateA - dateB;
      return dateB - dateA;
    });
    
    return result;
  }, [cases, searchQuery, sortBy, sortOrder, statusFilter, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedCases.length / CASES_PER_PAGE));
  const paginatedCases = useMemo(() => {
    const startIndex = (currentPage - 1) * CASES_PER_PAGE;
    return filteredAndSortedCases.slice(startIndex, startIndex + CASES_PER_PAGE);
  }, [filteredAndSortedCases, currentPage]);
  const visiblePageItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => String(index + 1));
    }

    const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    if (currentPage <= 4) {
      [2, 3, 4, 5].forEach((page) => pages.add(page));
    }
    if (currentPage >= totalPages - 3) {
      [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach((page) => pages.add(page));
    }

    const sortedPages = Array.from(pages)
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);

    return sortedPages.flatMap((page, index) => {
      const previousPage = sortedPages[index - 1];
      if (index > 0 && previousPage && page - previousPage > 1) {
        return [ELLIPSIS, String(page)];
      }
      return [String(page)];
    });
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, startDate, endDate]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const handleSort = (field: "date_filed" | "date") => {
    if (sortBy === field) {
      setSortOrder((order) => order === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  };

  const handleStartDateChange = (value: string) => {
    const clampedValue = value && value > todayDate ? todayDate : value;
    setStartDate(clampedValue);
    if (endDate && clampedValue && endDate < clampedValue) {
      setEndDate("");
    }
  };

  const handleEndDateChange = (value: string) => {
    if (value && value > todayDate) {
      setEndDate(todayDate);
      return;
    }
    if (value && startDate && value < startDate) {
      setEndDate(startDate);
      return;
    }
    setEndDate(value);
  };

  const isFilterModified = 
    searchQuery !== "" || 
    statusFilter !== "All Statuses" || 
    startDate !== "" || 
    endDate !== "";

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All Statuses");
    setStartDate("");
    setEndDate("");
  };

  const handleDeleteCase = async () => {
    if (deleteConfirmId === null) return;
    try {
      await invoke("delete_case", { id: deleteConfirmId });
      closeDeleteConfirm();
      window.dispatchEvent(new Event("cases:changed"));
    } catch (err) {
      alert("Failed to delete case: " + err);
    }
  };

  const closeDeleteConfirm = () => {
    setIsDeleteConfirmClosing(true);
    window.setTimeout(() => {
      setDeleteConfirmId(null);
      setIsDeleteConfirmClosing(false);
    }, MODAL_EXIT_MS);
  };

  const handleExportExcel = async () => {
    if (filteredAndSortedCases.length === 0) {
      alert("No cases to export.");
      return;
    }

    // Determine active filters text
    const activeFilters: string[] = [];
    if (searchQuery.trim()) {
      activeFilters.push(`Search: "${searchQuery.trim()}"`);
    }
    if (statusFilter !== "All Statuses") {
      activeFilters.push(`Status: ${statusFilter}`);
    }
    if (startDate || endDate) {
      const start = startDate ? formatIncidentDate(startDate) : "Any";
      const end = endDate ? formatIncidentDate(endDate) : "Any";
      activeFilters.push(`Date: ${start} — ${end}`);
    }
    const filterText = activeFilters.join(", ") || "None";

    // Build the sheet data with filter headers at the top
    const aoaData: any[][] = [
      ["CASE CATALOG EXPORT"],
      [`Exported on: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`],
      [`Active Filters: ${filterText}`],
      [], // blank row
      [
        "Case ID",
        "Date Filed",
        "Incident Date",
        "Student Name(s)",
        "Case Type",
        "Description",
        "Status",
        "Adviser(s)",
        "Sanction"
      ]
    ];

    filteredAndSortedCases.forEach((c) => {
      const students = parseStudents(c.students);
      const studentNames = students.map(s => `${s.lastName}, ${s.firstName} ${s.middleInitial ? s.middleInitial + '.' : ''}`.trim()).join("; ");
      const advisers = [...new Set(students.map(s => s.adviser))].filter(Boolean).join("; ");

      aoaData.push([
        formatCaseId(c.id),
        formatIncidentDate(c.date_filed),
        formatIncidentDate(c.date),
        studentNames,
        c.case,
        c.description || "",
        c.progress,
        advisers,
        c.sanction || "None"
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(aoaData);
    const workbook = XLSX.utils.book_new();

    // 1. Dynamic Sheet Name (strictly sanitized & <= 31 chars)
    let sheetName = "Cases";
    if (activeFilters.length > 0) {
      const nameParts: string[] = [];
      if (statusFilter !== "All Statuses") {
        nameParts.push(statusFilter);
      }
      if (startDate || endDate) {
        const start = startDate ? formatIncidentDate(startDate) : "";
        const end = endDate ? formatIncidentDate(endDate) : "";
        if (start && end) nameParts.push(`${start}-${end}`);
        else if (start) nameParts.push(`From ${start}`);
        else if (end) nameParts.push(`To ${end}`);
      }
      if (searchQuery.trim()) {
        nameParts.push(searchQuery.trim());
      }
      const rawSheetName = nameParts.join(" ").trim();
      if (rawSheetName) {
        sheetName = rawSheetName.replace(/[\\/*?[\]:]/g, "").substring(0, 31).trim() || "Cases";
      }
    }
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Auto-adjust column widths
    const columnWidths = [
      { wch: 12 }, // Case ID
      { wch: 15 }, // Date Filed
      { wch: 15 }, // Incident Date
      { wch: 30 }, // Student Name(s)
      { wch: 25 }, // Case Type
      { wch: 40 }, // Description
      { wch: 15 }, // Status
      { wch: 25 }, // Adviser(s)
      { wch: 30 }, // Sanction
    ];
    worksheet['!cols'] = columnWidths;

    // 2. Dynamic Filename based on filters
    const filenameParts: string[] = ["cases_export"];
    if (statusFilter !== "All Statuses") {
      filenameParts.push(statusFilter.toLowerCase());
    }
    if (startDate || endDate) {
      const start = startDate ? startDate.replace(/-/g, "") : "Any";
      const end = endDate ? endDate.replace(/-/g, "") : "Any";
      filenameParts.push(`${start}_to_${end}`);
    }
    if (searchQuery.trim()) {
      filenameParts.push(`search_${searchQuery.trim().replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}`);
    }
    if (filenameParts.length === 1) {
      filenameParts.push(getTodayDateString());
    }
    const filename = `${filenameParts.join("_")}.xlsx`;

    try {
      const base64Data = XLSX.write(workbook, { bookType: "xlsx", type: "base64" });
      await invoke("save_file", { base64Data, filename });
    } catch (err) {
      alert("Failed to export Excel file: " + err);
    }
  };

  return (
    <>
      <div className="flex justify-between items-end mb-4">
        <h2 className="font-section-header text-section-header text-on-surface">Case Catalog</h2>
        <button
          onClick={handleExportExcel}
          className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-lg font-bold text-sm transition-colors duration-500 shadow-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">table_view</span>
          Export to Excel
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-surface border border-surface-variant rounded-lg p-3 px-4 py-2.5 border-t-4 border-t-secondary-container shadow-sm">
          <h3 className="font-body-md text-on-surface-variant text-xs mb-0.5">Total Cases</h3>
          <div className="font-data-mono text-2xl text-on-surface mt-1">{isLoading ? "..." : stats.totalCases}</div>
        </div>
        <div className="bg-surface border border-surface-variant rounded-lg p-3 px-4 py-2.5 border-t-4 border-t-[#f59e0b] shadow-sm">
          <h3 className="font-body-md text-on-surface-variant text-xs mb-0.5">Pending Cases</h3>
          <div className="font-data-mono text-2xl text-on-surface mt-1">{isLoading ? "..." : stats.pendingReview}</div>
        </div>
        <div className="bg-surface border border-surface-variant rounded-lg p-3 px-4 py-2.5 border-t-4 border-t-[#22c55e] shadow-sm">
          <h3 className="font-body-md text-on-surface-variant text-xs mb-0.5">Resolved Cases</h3>
          <div className="font-data-mono text-2xl text-on-surface mt-1">{isLoading ? "..." : stats.resolvedAllTime}</div>
        </div>
        <div className="bg-surface border border-surface-variant rounded-lg p-3 px-4 py-2.5 border-t-4 border-t-[#ef4444] shadow-sm">
          <h3 className="font-body-md text-on-surface-variant text-xs mb-0.5">Reprimanded Cases</h3>
          <div className="font-data-mono text-2xl text-on-surface mt-1">{isLoading ? "..." : stats.reprimandedCases}</div>
        </div>
      </div>

      {/* Search & Filters System */}
      <div className="bg-surface px-4 py-4 border border-outline-variant rounded-xl shadow-sm w-full flex flex-col">
        {/* Search Input */}
        <div className="relative w-full mb-4">
          <span className="material-symbols-outlined text-secondary absolute left-3 top-1/2 -translate-y-1/2" style={{ fontSize: '18px' }}>search</span>
          <input 
            type="text" 
            placeholder="Search by Case ID, Name, or Case Type"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 h-10 bg-surface border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-on-surface placeholder:text-on-surface-variant/70"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface flex items-center justify-center transition-colors duration-500"
            >
              <span className="material-symbols-outlined transition-colors duration-500" style={{ fontSize: '16px' }}>close</span>
            </button>
          )}
        </div>


        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-on-surface-variant whitespace-nowrap min-w-[52px]">Status</span>
          
          {["All Statuses", "Pending", "Resolved", "Reprimand"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full border text-[13px] whitespace-nowrap transition-all duration-500 select-none ${
                statusFilter === status 
                  ? "bg-[#EEEDFE] border-[#AFA9EC] text-[#3C3489]" 
                  : "bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              {status === "All Statuses" ? "All" : status}
            </button>
          ))}

          <div className="w-[1px] h-5 bg-outline-variant/60 mx-1"></div>

          {/* Start Date */}
          <DatePicker
            value={startDate}
            onChange={handleStartDateChange}
            prefix="Start Date:"
            placeholder="Pick start date"
            max={todayDate}
          />

          {/* End Date */}
          <DatePicker
            value={endDate}
            onChange={handleEndDateChange}
            prefix="End Date:"
            placeholder="Pick end date"
            min={startDate || undefined}
            max={todayDate}
          />
        </div>

        {/* Active Filters Row */}
        {isFilterModified && (
          <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-outline-variant/40">
            {searchQuery && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container border border-outline-variant text-xs text-on-surface">
                <span className="font-medium">"{searchQuery}"</span>
                <button onClick={() => setSearchQuery("")} className="text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors duration-500">
                  <span className="material-symbols-outlined transition-colors duration-500" style={{ fontSize: '14px' }}>close</span>
                </button>
              </div>
            )}

            {statusFilter !== "All Statuses" && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container border border-outline-variant text-xs text-on-surface">
                <span className="text-on-surface-variant">Status:</span>
                <span className="font-medium">{statusFilter}</span>
                <button onClick={() => setStatusFilter("All Statuses")} className="text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors duration-500">
                  <span className="material-symbols-outlined transition-colors duration-500" style={{ fontSize: '14px' }}>close</span>
                </button>
              </div>
            )}

            {(startDate || endDate) && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container border border-outline-variant text-xs text-on-surface">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '14px' }}>calendar_today</span>
                <span className="font-medium">
                  {startDate ? formatIncidentDate(startDate) : "Any"} — {endDate ? formatIncidentDate(endDate) : "Any"}
                </span>
                <button onClick={() => { setStartDate(""); setEndDate(""); }} className="text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors duration-500">
                  <span className="material-symbols-outlined transition-colors duration-500" style={{ fontSize: '14px' }}>close</span>
                </button>
              </div>
            )}

            <button onClick={resetFilters} className="text-xs text-primary hover:text-primary/80 font-medium ml-1 transition-colors duration-500">
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="bg-surface border border-surface-variant rounded-lg overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto overflow-y-scroll h-[calc(100vh-310px)] min-h-[250px] [scrollbar-gutter:stable]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-container border-b border-surface-variant font-section-header text-sm text-on-surface">
                <th className="p-table-cell-padding font-semibold">ID</th>
                <th 
                  className="p-table-cell-padding font-semibold cursor-pointer select-none group"
                  onClick={() => handleSort("date_filed")}
                >
                  <div className="flex items-center gap-1 text-[11px] tracking-wider uppercase text-secondary">
                    Filed
                    <span className={`material-symbols-outlined text-[16px] transition-[color,opacity,transform] duration-300 ease-out ${
                      sortBy === "date_filed" ? "text-primary" : "text-secondary opacity-30 group-hover:opacity-100"
                    } ${sortBy === "date_filed" && sortOrder === "desc" ? "rotate-180" : "rotate-0"}`}>
                      arrow_upward
                    </span>
                  </div>
                </th>
                <th 
                  className="p-table-cell-padding font-semibold cursor-pointer select-none group"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center gap-1 text-[11px] tracking-wider uppercase text-secondary">
                    Incident Date
                    <span className={`material-symbols-outlined text-[16px] transition-[color,opacity,transform] duration-300 ease-out ${
                      sortBy === "date" ? "text-primary" : "text-secondary opacity-30 group-hover:opacity-100"
                    } ${sortBy === "date" && sortOrder === "desc" ? "rotate-180" : "rotate-0"}`}>
                      arrow_upward
                    </span>
                  </div>
                </th>
                <th className="p-table-cell-padding font-semibold">Student Name</th>
                <th className="p-table-cell-padding font-semibold">Case Type</th>
                <th className="p-table-cell-padding font-semibold text-center">Status</th>
                <th className="p-table-cell-padding font-semibold">Adviser</th>
                <th className="py-1 px-4 font-semibold text-right"></th>
              </tr>
            </thead>
            <tbody className="font-body-md text-sm text-on-surface">
              {isLoading && (
                <tr>
                  <td className="p-table-cell-padding text-on-surface-variant text-center" colSpan={8}>
                    Loading cases...
                  </td>
                </tr>
              )}
              {!isLoading && error && (
                <tr>
                  <td className="p-table-cell-padding text-on-surface-variant text-center" colSpan={8}>
                    Backend unavailable. Open with npm run tauri -- dev to load cases.
                  </td>
                </tr>
              )}
              {!isLoading && !error && filteredAndSortedCases.length === 0 && (
                <tr>
                  <td className="p-table-cell-padding text-on-surface-variant text-center" colSpan={8}>
                    No cases match your filters.
                  </td>
                </tr>
              )}
              {!isLoading && !error && paginatedCases.map((caseRecord) => (
                <tr
                  key={caseRecord.id}
                  className="catalog-page-enter border-b border-surface-variant/50 hover:bg-surface-container transition-colors cursor-pointer group"
                  onClick={() => navigate(`/case/${caseRecord.id}`)}
                >
                  <td className="p-table-cell-padding">
                    <span className="case-id px-2 py-0.5 rounded text-data-mono font-data-mono inline-block">{formatCaseId(caseRecord.id)}</span>
                  </td>
                  <td className="p-table-cell-padding">
                    {(() => {
                      const rel = formatRelativeFiled(caseRecord.date_filed);
                      return (
                        <div className="flex flex-col leading-tight py-0.5">
                          <span className="font-semibold text-on-surface text-[13px]">{rel.primary}</span>
                          {rel.secondary && (
                            <span className="text-[11px] text-secondary mt-0.5">{rel.secondary}</span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-table-cell-padding font-bold text-on-surface">{formatIncidentDate(caseRecord.date)}</td>
                  <td className="p-table-cell-padding font-medium">
                    {(() => {
                      const students = parseStudents(caseRecord.students);
                      if (students.length === 0) return "—";
                      const firstStudent = students[0];
                      const name = `${firstStudent.lastName}, ${firstStudent.firstName}${firstStudent.middleInitial ? ` ${firstStudent.middleInitial}.` : ""}`;
                      return students.length > 1 ? <span title={`${students.length} students involved`}>{name} <span className="text-xs text-secondary">(+{students.length - 1} others)</span></span> : name;
                    })()}
                  </td>
                  <td className="p-table-cell-padding">
                    <span className="text-xs text-on-surface-variant">{caseRecord.case}</span>
                  </td>
                  <td className="p-table-cell-padding text-center">
                    <span className={`${getBadgeClass(caseRecord.progress)} border px-2 py-1 rounded font-label-caps text-[10px] tracking-wider uppercase inline-block min-w-[76px] text-center`}>{caseRecord.progress}</span>
                  </td>
                  <td className="p-table-cell-padding text-on-surface-variant">
                    {(() => {
                      const students = parseStudents(caseRecord.students);
                      if (students.length === 0) return "—";
                      const firstStudent = students[0];
                      return students.length > 1 ? `${firstStudent.adviser} (+${students.length - 1} others)` : firstStudent.adviser;
                    })()}
                  </td>
                  <td className="py-1 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDeleteConfirmClosing(false);
                        setDeleteConfirmId(caseRecord.id);
                      }}
                      className="text-secondary hover:text-error transition-all duration-500 p-1.5 rounded-full hover:bg-error-container/60 inline-flex items-center justify-center align-middle"
                      title="Delete Record"
                    >
                      <span className="material-symbols-outlined text-[18px] transition-colors duration-500">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-surface border-t border-surface-variant px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-on-surface-variant">
            {isLoading
              ? "Loading entries"
              : `Showing ${filteredAndSortedCases.length === 0 ? 0 : ((currentPage - 1) * CASES_PER_PAGE) + 1} to ${Math.min(currentPage * CASES_PER_PAGE, filteredAndSortedCases.length)} of ${filteredAndSortedCases.length} entries`}
          </span>
          <div key={currentPage} className="catalog-page-enter flex flex-wrap items-center justify-end gap-1">
            <button
              onClick={handlePreviousPage}
              className="px-3 py-1 border border-outline-variant rounded bg-surface hover:bg-surface-container-low text-on-surface-variant disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors duration-500"
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {visiblePageItems.map((item, index) => {
              if (item === ELLIPSIS) {
                return (
                  <span key={`${item}-${index}`} className="px-2 py-1 text-sm text-on-surface-variant">
                    ...
                  </span>
                );
              }

              const page = Number(item);
              const isActive = page === currentPage;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-8 px-3 py-1 border rounded text-sm transition-colors duration-500 ${
                    isActive
                      ? "border-primary-container bg-primary-container text-white"
                      : "border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={handleNextPage}
              className="px-3 py-1 border border-outline-variant rounded bg-surface hover:bg-surface-container-low text-on-surface-variant disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors duration-500"
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className={`absolute inset-0 bg-black/45 ${
              isDeleteConfirmClosing ? "modal-backdrop-exit" : "modal-backdrop-enter"
            }`}
            style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
            onClick={closeDeleteConfirm}
          />
          <div className={`relative bg-surface p-6 rounded-2xl shadow-xl max-w-sm w-full border border-outline-variant ${
            isDeleteConfirmClosing ? "modal-panel-exit" : "modal-panel-enter"
          }`}>
            <div className="flex items-center gap-3 text-error mb-3">
              <span className="material-symbols-outlined text-[28px]">warning</span>
              <h3 className="text-xl font-bold">Confirm Deletion</h3>
            </div>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              Are you sure you want to delete case record <span className="font-bold text-on-surface">{formatCaseId(deleteConfirmId)}</span>? This action cannot be undone and will permanently remove this record from the database.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeDeleteConfirm}
                className="px-4 py-2 rounded-lg font-bold text-sm bg-surface-container hover:bg-surface-container-high transition-colors duration-500 text-on-surface border border-outline-variant"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCase}
                className="px-4 py-2 rounded-lg font-bold text-sm bg-error hover:bg-[#b91c1c] transition-colors duration-500 text-white shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px] transition-colors duration-500">delete_forever</span>
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
