import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import DatePicker from "../components/DatePicker";

interface CaseRecord {
  id: number;
  first_name: string;
  last_name: string;
  middle_initial: string;
  level: string;
  section: string;
  date: string;
  date_filed: string;
  adviser: string;
  case: string;
  sanction: string;
  progress: string;
}

const formatCaseId = (id: number) => `#${id.toString().padStart(4, "0")}`;

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

const wasResolvedWithinLast30Days = (caseRecord: CaseRecord) => {
  if (!isResolved(caseRecord.progress)) {
    return false;
  }

  const resolvedDate = new Date(caseRecord.date);

  if (Number.isNaN(resolvedDate.getTime())) {
    return false;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return resolvedDate >= thirtyDaysAgo;
};

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
  const [sortBy, setSortBy] = useState<"date_filed" | "date" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
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
    const activeCases = cases.filter((caseRecord) => !isResolved(caseRecord.progress));

    return {
      totalActiveCases: activeCases.length,
      pendingReview: cases.filter((caseRecord) => isPending(caseRecord.progress)).length,
      resolvedLast30Days: cases.filter(wasResolvedWithinLast30Days).length,
      activeReprimands: activeCases.filter(isReprimand).length,
    };
  }, [cases]);

  const filteredAndSortedCases = useMemo(() => {
    let result = cases;

    // Search query filter (search Case ID or Name or case type)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => {
        const idStr = `#${c.id.toString().padStart(4, "0")}`;
        const nameStr = `${c.first_name} ${c.middle_initial} ${c.last_name}`.toLowerCase();
        return (
          idStr.toLowerCase().includes(q) ||
          c.first_name.toLowerCase().includes(q) ||
          c.last_name.toLowerCase().includes(q) ||
          c.middle_initial.toLowerCase().includes(q) ||
          nameStr.includes(q) ||
          c.case.toLowerCase().includes(q) ||
          (c.adviser && c.adviser.toLowerCase().includes(q))
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
      const activeSortField = sortBy || "date_filed";
      const activeSortOrder = sortBy ? sortOrder : "desc";

      const dateA = new Date(activeSortField === "date_filed" ? (a.date_filed || a.date) : a.date).getTime();
      const dateB = new Date(activeSortField === "date_filed" ? (b.date_filed || b.date) : b.date).getTime();
      
      if (activeSortOrder === "asc") return dateA - dateB;
      return dateB - dateA;
    });
    
    return result;
  }, [cases, searchQuery, sortBy, sortOrder, statusFilter, startDate, endDate]);

  const handleSort = (field: "date_filed" | "date") => {
    if (sortBy === field) {
      if (sortOrder === "desc") {
        setSortOrder("asc");
      } else {
        setSortBy(null);
        setSortOrder("desc");
      }
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
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
      setDeleteConfirmId(null);
      window.dispatchEvent(new Event("cases:changed"));
    } catch (err) {
      alert("Failed to delete case: " + err);
    }
  };

  return (
    <>
      <div className="flex justify-between items-end">
        <h2 className="font-section-header text-section-header text-on-surface">Case Catalog</h2>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-surface border border-surface-variant rounded-lg p-3 px-4 py-2.5 border-t-4 border-t-secondary-container shadow-sm">
          <h3 className="font-body-md text-on-surface-variant text-xs mb-0.5">Total Active Cases</h3>
          <div className="font-data-mono text-2xl text-on-surface mt-1">{isLoading ? "..." : stats.totalActiveCases}</div>
        </div>
        <div className="bg-surface border border-surface-variant rounded-lg p-3 px-4 py-2.5 border-t-4 border-t-[#f59e0b] shadow-sm">
          <h3 className="font-body-md text-on-surface-variant text-xs mb-0.5">Pending Review</h3>
          <div className="font-data-mono text-2xl text-on-surface mt-1">{isLoading ? "..." : stats.pendingReview}</div>
        </div>
        <div className="bg-surface border border-surface-variant rounded-lg p-3 px-4 py-2.5 border-t-4 border-t-[#22c55e] shadow-sm">
          <h3 className="font-body-md text-on-surface-variant text-xs mb-0.5">Resolved (30d)</h3>
          <div className="font-data-mono text-2xl text-on-surface mt-1">{isLoading ? "..." : stats.resolvedLast30Days}</div>
        </div>
        <div className="bg-surface border border-surface-variant rounded-lg p-3 px-4 py-2.5 border-t-4 border-t-[#ef4444] shadow-sm">
          <h3 className="font-body-md text-on-surface-variant text-xs mb-0.5">Active Reprimands</h3>
          <div className="font-data-mono text-2xl text-on-surface mt-1">{isLoading ? "..." : stats.activeReprimands}</div>
        </div>
      </div>

      {/* Search & Filters System */}
      <div className="bg-surface px-4 py-4 border border-outline-variant rounded-xl shadow-sm w-full flex flex-col">
        {/* Search Input */}
        <div className="relative w-full mb-4">
          <span className="material-symbols-outlined text-secondary absolute left-3 top-1/2 -translate-y-1/2" style={{ fontSize: '18px' }}>search</span>
          <input 
            type="text" 
            placeholder="Search Case ID, student name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 h-10 bg-surface border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-on-surface placeholder:text-on-surface-variant/70"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface flex items-center justify-center"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          )}
        </div>


        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-on-surface-variant whitespace-nowrap min-w-[52px]">Status</span>
          
          {["All Statuses", "Pending", "Resolved", "Reprimand"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full border text-[13px] whitespace-nowrap transition-all select-none ${
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
                <button onClick={() => setSearchQuery("")} className="text-on-surface-variant hover:text-on-surface flex items-center justify-center">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                </button>
              </div>
            )}

            {statusFilter !== "All Statuses" && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container border border-outline-variant text-xs text-on-surface">
                <span className="text-on-surface-variant">Status:</span>
                <span className="font-medium">{statusFilter}</span>
                <button onClick={() => setStatusFilter("All Statuses")} className="text-on-surface-variant hover:text-on-surface flex items-center justify-center">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                </button>
              </div>
            )}

            {(startDate || endDate) && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container border border-outline-variant text-xs text-on-surface">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '14px' }}>calendar_today</span>
                <span className="font-medium">
                  {startDate ? formatIncidentDate(startDate) : "Any"} — {endDate ? formatIncidentDate(endDate) : "Any"}
                </span>
                <button onClick={() => { setStartDate(""); setEndDate(""); }} className="text-on-surface-variant hover:text-on-surface flex items-center justify-center">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                </button>
              </div>
            )}

            <button onClick={resetFilters} className="text-xs text-primary hover:text-primary/80 font-medium ml-1 transition-colors">
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="bg-surface border border-surface-variant rounded-lg overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-310px)] min-h-[250px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-container border-b border-surface-variant font-section-header text-sm text-on-surface">
                <th className="p-table-cell-padding font-semibold">ID</th>
                <th 
                  className="p-table-cell-padding font-semibold cursor-pointer select-none group"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center gap-1 text-[11px] tracking-wider uppercase text-secondary">
                    Incident Date
                    <span className={`material-symbols-outlined text-[16px] transition-all ${
                      sortBy === "date" ? "text-primary" : "text-secondary opacity-30 group-hover:opacity-100"
                    }`}>
                      {sortBy === "date" ? (sortOrder === "desc" ? "arrow_downward" : "arrow_upward") : "arrow_upward"}
                    </span>
                  </div>
                </th>
                <th 
                  className="p-table-cell-padding font-semibold cursor-pointer select-none group"
                  onClick={() => handleSort("date_filed")}
                >
                  <div className="flex items-center gap-1 text-[11px] tracking-wider uppercase text-secondary">
                    Filed
                    <span className={`material-symbols-outlined text-[16px] transition-all ${
                      sortBy === "date_filed" ? "text-primary" : "text-secondary opacity-30 group-hover:opacity-100"
                    }`}>
                      {sortBy === "date_filed" ? (sortOrder === "desc" ? "arrow_downward" : "arrow_upward") : "arrow_upward"}
                    </span>
                  </div>
                </th>
                <th className="p-table-cell-padding font-semibold">Student Name</th>
                <th className="p-table-cell-padding font-semibold">Case Type</th>
                <th className="p-table-cell-padding font-semibold">Status</th>
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
              {!isLoading && !error && filteredAndSortedCases.map((caseRecord) => (
                <tr
                  key={caseRecord.id}
                  className="border-b border-surface-variant/50 hover:bg-surface-container transition-colors cursor-pointer group"
                  onClick={() => navigate(`/case/${caseRecord.id}`)}
                >
                  <td className="p-table-cell-padding">
                    <span className="case-id px-2 py-0.5 rounded text-data-mono font-data-mono inline-block">{formatCaseId(caseRecord.id)}</span>
                  </td>
                  <td className="p-table-cell-padding font-bold text-on-surface">{formatIncidentDate(caseRecord.date)}</td>
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
                  <td className="p-table-cell-padding font-medium">
                    {caseRecord.last_name}, {caseRecord.first_name}{caseRecord.middle_initial ? ` ${caseRecord.middle_initial}.` : ""}
                  </td>
                  <td className="p-table-cell-padding">
                    <span className="bg-surface-container-high px-2 py-1 rounded text-xs text-on-surface-variant border border-outline-variant">{caseRecord.case}</span>
                  </td>
                  <td className="p-table-cell-padding">
                    <span className={`${getBadgeClass(caseRecord.progress)} border px-2 py-1 rounded font-label-caps text-[10px] tracking-wider uppercase inline-block`}>{caseRecord.progress}</span>
                  </td>
                  <td className="p-table-cell-padding text-on-surface-variant">{caseRecord.adviser}</td>
                  <td className="py-1 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(caseRecord.id);
                      }}
                      className="text-secondary hover:text-error transition-all p-1.5 rounded-full hover:bg-error-container/60 inline-flex items-center justify-center align-middle"
                      title="Delete Record"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-surface border-t border-surface-variant px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-on-surface-variant">
            {isLoading ? "Loading entries" : `Showing ${filteredAndSortedCases.length === 0 ? 0 : 1} to ${filteredAndSortedCases.length} of ${cases.length} entries`}
          </span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-outline-variant rounded bg-surface hover:bg-surface-container-low text-on-surface-variant disabled:opacity-50 text-sm" disabled>Previous</button>
            <button className="px-3 py-1 border border-primary-container rounded bg-primary-container text-white text-sm">1</button>
            <button className="px-3 py-1 border border-outline-variant rounded bg-surface hover:bg-surface-container-low text-on-surface-variant text-sm">Next</button>
          </div>
        </div>
      </div>

      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/45" 
            style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative bg-surface p-6 rounded-2xl shadow-xl max-w-sm w-full border border-outline-variant animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-error mb-3">
              <span className="material-symbols-outlined text-[28px]">warning</span>
              <h3 className="text-xl font-bold">Confirm Deletion</h3>
            </div>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              Are you sure you want to delete case record <span className="font-bold text-on-surface">{formatCaseId(deleteConfirmId)}</span>? This action cannot be undone and will permanently remove this record from the database.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg font-bold text-sm bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface border border-outline-variant"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCase}
                className="px-4 py-2 rounded-lg font-bold text-sm bg-error hover:bg-[#b91c1c] transition-colors text-white shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
