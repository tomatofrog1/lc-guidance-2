import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import DatePicker from "../components/DatePicker";

interface CaseRecord {
  id: number;
  first_name: string;
  last_name: string;
  level: string;
  section: string;
  date: string;
  adviser: string;
  case: string;
  sanction: string;
  progress: string;
}

const formatCaseId = (id: number) => `#${id.toString().padStart(4, "0")}`;

const formatDate = (date: string) => {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  const [dateSort, setDateSort] = useState<"default" | "desc" | "asc">("default");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
        const nameStr = `${c.first_name} ${c.last_name}`.toLowerCase();
        return (
          idStr.toLowerCase().includes(q) ||
          c.first_name.toLowerCase().includes(q) ||
          c.last_name.toLowerCase().includes(q) ||
          nameStr.includes(q) ||
          c.case.toLowerCase().includes(q) ||
          (c.adviser && c.adviser.toLowerCase().includes(q))
        );
      });
    }

    if (typeFilter !== "All Types") {
      result = result.filter(c => {
        if (typeFilter === "Academic") return c.case.toLowerCase().includes("academic");
        if (typeFilter === "Behavioral") return c.case.toLowerCase().includes("behavioral") || c.case.toLowerCase().includes("behavioural");
        if (typeFilter === "Attendance") return c.case.toLowerCase().includes("attendance") || c.case.toLowerCase().includes("absenteeism") || c.case.toLowerCase().includes("truancy");
        return c.case === typeFilter;
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
        const dateVal = new Date(c.date);
        return dateVal >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((c) => {
        const dateVal = new Date(c.date);
        return dateVal <= end;
      });
    }

    if (dateSort !== "default") {
      result = [...result].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        
        if (dateSort === "asc") return dateA - dateB;
        return dateB - dateA;
      });
    }
    
    return result;
  }, [cases, searchQuery, dateSort, typeFilter, statusFilter, startDate, endDate]);

  const toggleDateSort = () => {
    setDateSort(prev => {
      if (prev === "default") return "desc";
      if (prev === "desc") return "asc";
      return "default";
    });
  };

  const isFilterModified = 
    searchQuery !== "" || 
    typeFilter !== "All Types" || 
    statusFilter !== "All Statuses" || 
    startDate !== "" || 
    endDate !== "";

  const resetFilters = () => {
    setSearchQuery("");
    setTypeFilter("All Types");
    setStatusFilter("All Statuses");
    setStartDate("");
    setEndDate("");
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

      {/* Search & Filters Row */}
      <div className="flex flex-col xl:flex-row gap-3 items-center justify-between bg-surface p-4 border border-outline-variant rounded-xl shadow-sm">
        {/* Search Input */}
        <div className="relative flex items-center flex-1 w-full min-w-0">
          <span className="material-symbols-outlined text-secondary absolute left-3" style={{ fontSize: '20px' }}>search</span>
          <input 
            type="text" 
            placeholder="Search Case ID, student name, or case type..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 h-[38px] bg-surface-container border border-outline-variant rounded-full text-body-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="absolute right-3 text-secondary hover:text-on-surface"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Type Filter */}
          <div className="relative">
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none bg-surface-container hover:bg-surface-container-high transition-colors border border-outline-variant rounded-full pl-4 pr-10 h-[38px] font-body-md text-sm text-on-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
              <option value="All Types">All Types</option>
              <option value="Academic">Academic</option>
              <option value="Behavioral">Behavioral</option>
              <option value="Attendance">Attendance</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>expand_more</span>
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-surface-container hover:bg-surface-container-high transition-colors border border-outline-variant rounded-full pl-4 pr-10 h-[38px] font-body-md text-sm text-on-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
              <option value="All Statuses">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
              <option value="Reprimand">Reprimand</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>expand_more</span>
            </div>
          </div>

          {/* Start Date */}
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            prefix="Start:"
            placeholder="Pick start date"
          />

          {/* End Date */}
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            prefix="End:"
            placeholder="Pick end date"
          />

          {/* Reset Filters Icon Button */}
          <button
            onClick={resetFilters}
            disabled={!isFilterModified}
            title="Reset Filters"
            className={`w-[38px] h-[38px] rounded-full flex items-center justify-center border shrink-0 transition-all ${
              isFilterModified
                ? "bg-primary text-white border-primary hover:bg-primary/95 cursor-pointer shadow-sm"
                : "bg-surface-container text-secondary/40 border-outline-variant opacity-60 cursor-not-allowed"
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>restart_alt</span>
          </button>
        </div>
      </div>

      <div className="bg-surface border border-surface-variant rounded-lg overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-310px)] min-h-[250px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-container border-b border-surface-variant font-section-header text-sm text-on-surface">
                <th className="p-table-cell-padding font-semibold">ID</th>
                <th 
                  className="p-table-cell-padding font-semibold cursor-pointer select-none group"
                  onClick={toggleDateSort}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <span className={`material-symbols-outlined text-[16px] transition-colors ${dateSort !== 'default' ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>
                      {dateSort === "default" ? "swap_vert" : dateSort === "desc" ? "arrow_downward" : "arrow_upward"}
                    </span>
                  </div>
                </th>
                <th className="p-table-cell-padding font-semibold">Student Name</th>
                <th className="p-table-cell-padding font-semibold">Case Type</th>
                <th className="p-table-cell-padding font-semibold">Status</th>
                <th className="p-table-cell-padding font-semibold">Adviser</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-sm text-on-surface">
              {isLoading && (
                <tr>
                  <td className="p-table-cell-padding text-on-surface-variant text-center" colSpan={6}>
                    Loading cases...
                  </td>
                </tr>
              )}
              {!isLoading && error && (
                <tr>
                  <td className="p-table-cell-padding text-on-surface-variant text-center" colSpan={6}>
                    Backend unavailable. Open with npm run tauri -- dev to load cases.
                  </td>
                </tr>
              )}
              {!isLoading && !error && filteredAndSortedCases.length === 0 && (
                <tr>
                  <td className="p-table-cell-padding text-on-surface-variant text-center" colSpan={6}>
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
                  <td className="p-table-cell-padding text-on-surface-variant">{formatDate(caseRecord.date)}</td>
                  <td className="p-table-cell-padding font-medium">{caseRecord.first_name} {caseRecord.last_name}</td>
                  <td className="p-table-cell-padding">
                    <span className="bg-surface-container-high px-2 py-1 rounded text-xs text-on-surface-variant border border-outline-variant">{caseRecord.case}</span>
                  </td>
                  <td className="p-table-cell-padding">
                    <span className={`${getBadgeClass(caseRecord.progress)} border px-2 py-1 rounded font-label-caps text-[10px] tracking-wider uppercase inline-block`}>{caseRecord.progress}</span>
                  </td>
                  <td className="p-table-cell-padding text-on-surface-variant">{caseRecord.adviser}</td>
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
    </>
  );
}
