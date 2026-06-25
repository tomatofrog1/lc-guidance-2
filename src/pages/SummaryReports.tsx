import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";

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
  sanction: string;
  progress: string;
}

type ReportView = "monthly" | "yearly";

interface TimeReportPoint {
  label: string;
  total: number;
  completed: number;
  reprimand: number;
  pending: number;
  other: number;
}

const formatCaseId = (id: number) => `LC-${id.toString().padStart(4, "0")}`;

const getAcademicYearStart = (date: Date) => {
  return date.getMonth() >= 5 ? date.getFullYear() : date.getFullYear() - 1;
};

const formatAcademicYear = (startYear: number) => `A.Y. ${startYear}-${startYear + 1}`;

const parseStudents = (studentsStr: string): StudentInfo[] => {
  try {
    return JSON.parse(studentsStr) || [];
  } catch (e) {
    return [];
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const now = new Date();
  
  const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d2 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = Math.abs(d1.getTime() - d2.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (diffDays === 0) return `Today`;
  if (diffDays === 1) return `Yesterday`;
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const getBadgeClassAndColor = (progress: string) => {
  const normalizedProgress = progress.toLowerCase();
  if (normalizedProgress === "resolved") {
    return { 
      bg: "bg-secondary-container", 
      text: "text-on-secondary-container", 
      border: "border-secondary-fixed-dim",
      dot: "bg-secondary"
    };
  }
  if (normalizedProgress === "closed") {
    return {
      bg: "bg-surface-container-high",
      text: "text-on-surface-variant",
      border: "border-outline-variant",
      dot: "bg-outline"
    };
  }
  if (normalizedProgress.includes("reprimand")) {
    return { 
      bg: "bg-tertiary-container", 
      text: "text-on-tertiary-container", 
      border: "border-[#ffb4a7]", 
      dot: "bg-tertiary"
    };
  }
  return { 
    bg: "bg-error-container", 
    text: "text-on-error-container", 
    border: "border-[#ffb4a7]",
    dot: "bg-error"
  };
};

export default function SummaryReports() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportView, setReportView] = useState<ReportView>("monthly");

  useEffect(() => {
    const loadCases = async () => {
      try {
        setIsLoading(true);
        const loadedCases = await invoke<CaseRecord[]>("get_cases");
        setCases(loadedCases);
      } catch (err) {
        console.error("Failed to load cases", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadCases();
    
    const handleCasesChanged = () => loadCases();
    window.addEventListener("cases:changed", handleCasesChanged);
    return () => window.removeEventListener("cases:changed", handleCasesChanged);
  }, []);

  const stats = useMemo(() => {
    const total = cases.length;
    const pending = cases.filter(c => c.progress.toLowerCase() === "pending").length;
    const resolved = cases.filter(c => c.progress.toLowerCase() === "resolved").length;
    
    const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : "0.0";
    
    const typeCounts: Record<string, number> = {};
    cases.forEach(c => {
      typeCounts[c.case] = (typeCounts[c.case] || 0) + 1;
    });
    
    let mostCommonType = "None";
    let mostCommonCount = 0;
    
    for (const [type, count] of Object.entries(typeCounts)) {
      if (count > mostCommonCount) {
        mostCommonCount = count;
        mostCommonType = type;
      }
    }
    
    const mostCommonPercentage = total > 0 ? ((mostCommonCount / total) * 100).toFixed(0) : "0";
    
    const recentCases = [...cases].sort((a, b) => new Date(b.date_filed || b.date).getTime() - new Date(a.date_filed || a.date).getTime()).slice(0, 5);

    const now = new Date();
    const currentAcademicYearStart = getAcademicYearStart(now);
    const currentAcademicYearLabel = formatAcademicYear(currentAcademicYearStart);
    const monthlyReports: TimeReportPoint[] = Array.from({ length: 12 }, (_, monthIndex) => ({
      label: new Date(currentAcademicYearStart, monthIndex + 5, 1).toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
      total: 0,
      completed: 0,
      reprimand: 0,
      pending: 0,
      other: 0,
    }));
    const yearlyReportMap = new Map<number, TimeReportPoint>();
    yearlyReportMap.set(currentAcademicYearStart, {
      label: currentAcademicYearLabel,
      total: 0,
      completed: 0,
      reprimand: 0,
      pending: 0,
      other: 0,
    });

    const addCaseToReport = (report: TimeReportPoint, progress: string) => {
      const normalizedProgress = progress.toLowerCase();
      report.total += 1;

      if (normalizedProgress === "resolved" || normalizedProgress === "closed") {
        report.completed += 1;
      } else if (normalizedProgress.includes("reprimand")) {
        report.reprimand += 1;
      } else if (normalizedProgress === "pending") {
        report.pending += 1;
      } else {
        report.other += 1;
      }
    };

    cases.forEach(c => {
      const d = new Date(c.date_filed || c.date);
      if (isNaN(d.getTime())) return;

      const academicYearStart = getAcademicYearStart(d);
      if (academicYearStart === currentAcademicYearStart) {
        const monthOffset = (d.getFullYear() - currentAcademicYearStart) * 12 + d.getMonth() - 5;
        if (monthOffset >= 0 && monthOffset < monthlyReports.length) {
          addCaseToReport(monthlyReports[monthOffset], c.progress);
        }
      }

      if (!yearlyReportMap.has(academicYearStart)) {
        yearlyReportMap.set(academicYearStart, {
          label: formatAcademicYear(academicYearStart),
          total: 0,
          completed: 0,
          reprimand: 0,
          pending: 0,
          other: 0,
        });
      }

      const yearlyReport = yearlyReportMap.get(academicYearStart);
      if (yearlyReport) {
        addCaseToReport(yearlyReport, c.progress);
      }
    });

    const yearlyReports = Array.from(yearlyReportMap.entries())
      .sort(([yearA], [yearB]) => yearA - yearB)
      .map(([, report]) => report);

    const currentYearTotal = monthlyReports.reduce((sum, report) => sum + report.total, 0);

    const peakMonthlyReport = monthlyReports.reduce((peak, report) =>
      report.total > peak.total ? report : peak, monthlyReports[0]);
    const peakYearlyReport = yearlyReports.reduce((peak, report) =>
      report.total > peak.total ? report : peak, yearlyReports[0]);

    const averageMonthlyCases = currentYearTotal > 0 ? (currentYearTotal / 12).toFixed(1) : "0.0";
    const averageYearlyCases = yearlyReports.length > 0
      ? (yearlyReports.reduce((sum, report) => sum + report.total, 0) / yearlyReports.length).toFixed(1)
      : "0.0";

    return {
      total,
      pending,
      resolved,
      resolutionRate,
      mostCommonType,
      mostCommonPercentage,
      recentCases,
      monthlyReports,
      yearlyReports,
      currentAcademicYearLabel,
      peakMonthlyReport,
      peakYearlyReport,
      averageMonthlyCases,
      averageYearlyCases,
    };
  }, [cases]);

  const activeReportData = reportView === "monthly" ? stats.monthlyReports : stats.yearlyReports;
  const activeReportTotal = activeReportData.reduce((sum, report) => sum + report.total, 0);
  const activeReportCompleted = activeReportData.reduce((sum, report) => sum + report.completed, 0);
  const activeReportPending = activeReportData.reduce((sum, report) => sum + report.pending, 0);
  const activeReportReprimand = activeReportData.reduce((sum, report) => sum + report.reprimand, 0);
  const activeReportOther = activeReportData.reduce((sum, report) => sum + report.other, 0);
  const activeReportPeak = reportView === "monthly" ? stats.peakMonthlyReport : stats.peakYearlyReport;
  const activeReportAverage = reportView === "monthly" ? stats.averageMonthlyCases : stats.averageYearlyCases;
  const maxReportTotal = Math.max(1, ...activeReportData.map((report) => report.total));
  const reportChartTicks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="data-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-label-caps text-secondary uppercase">Total Cases</span>
            <span className="material-symbols-outlined text-primary-container bg-secondary-container dark:bg-[#1E293B] dark:text-[#3B82F6] p-1.5 rounded-DEFAULT" style={{ fontSize: '20px' }}>folder</span>
          </div>
          <div>
            <h3 className="font-display-title text-display-title text-on-background m-0 leading-none">{isLoading ? "..." : stats.total}</h3>
            <p className="text-body-md font-body-md text-secondary mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: '16px' }}>arrow_upward</span>
              <span className="text-[#15803d] dark:text-[#34A06A] font-medium">All Time</span>
            </p>
          </div>
        </div>
        <div className="data-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-label-caps text-secondary uppercase">Pending Action</span>
            <span className="material-symbols-outlined text-tertiary-container bg-error-container dark:bg-[#7F1D1D] dark:text-white p-1.5 rounded-DEFAULT" style={{ fontSize: '20px' }}>pending_actions</span>
          </div>
          <div>
            <h3 className="font-display-title text-display-title text-on-background m-0 leading-none">{isLoading ? "..." : stats.pending}</h3>
            <p className="text-body-md font-body-md text-secondary mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-tertiary-container dark:text-error" style={{ fontSize: '16px' }}>error</span>
              <span className="text-tertiary-container dark:text-error font-medium">Requires attention</span>
            </p>
          </div>
        </div>
        <div className="data-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-label-caps text-secondary uppercase">Resolved</span>
            <span className="material-symbols-outlined text-primary-container bg-secondary-container dark:bg-[#1E293B] dark:text-[#3B82F6] p-1.5 rounded-DEFAULT" style={{ fontSize: '20px' }}>check_circle</span>
          </div>
          <div>
            <h3 className="font-display-title text-display-title text-on-background m-0 leading-none">{isLoading ? "..." : stats.resolved}</h3>
            <p className="text-body-md font-body-md text-secondary mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: '16px' }}>check</span>
              <span className="text-secondary font-medium">{stats.resolutionRate}% resolution rate</span>
            </p>
          </div>
        </div>
        <div className="data-card p-6 flex flex-col justify-between bg-primary-fixed dark:bg-surface border-primary-fixed-dim dark:border-outline-variant">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-label-caps text-on-primary-fixed dark:text-secondary uppercase">Most Common Type</span>
            <span className="material-symbols-outlined text-primary bg-surface dark:bg-transparent dark:text-[#3B82F6] p-1.5 rounded-DEFAULT" style={{ fontSize: '20px' }}>warning</span>
          </div>
          <div>
            <h3 className="font-section-header text-section-header text-primary dark:text-[#3B82F6] m-0 leading-tight line-clamp-1">{isLoading ? "..." : stats.mostCommonType}</h3>
            <p className="text-body-md font-body-md text-on-primary-fixed-variant dark:text-on-surface mt-2 flex items-center gap-1">
              <span className="font-semibold">{stats.mostCommonPercentage}%</span> of all cases
            </p>
          </div>
        </div>
      </div>

      <div className="data-card p-6 flex flex-col">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="font-section-header text-section-header text-primary">Monthly & Yearly Reports</h3>
            <p className="text-body-md font-body-md text-secondary mt-1">
              {reportView === "monthly" ? `${stats.currentAcademicYearLabel} monthly activity` : "Academic year activity"}
            </p>
          </div>
          <div className="inline-flex self-start overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low">
            {([
              { value: "monthly", label: "Monthly" },
              { value: "yearly", label: "Yearly" },
            ] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setReportView(option.value)}
                className={`px-4 py-2 text-xs font-bold transition-colors duration-500 ${
                  reportView === option.value
                    ? "bg-primary text-on-primary"
                    : "text-secondary hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4 border-y border-surface-variant py-4">
          <div>
            <p className="font-label-caps text-label-caps text-secondary uppercase">Filed</p>
            <p className="mt-1 font-section-header text-section-header text-on-background">{activeReportTotal}</p>
          </div>
          <div>
            <p className="font-label-caps text-label-caps text-secondary uppercase">Completed</p>
            <p className="mt-1 font-section-header text-section-header text-[#0F6E56] dark:text-[#34A06A]">{activeReportCompleted}</p>
          </div>
          <div>
            <p className="font-label-caps text-label-caps text-secondary uppercase">Peak</p>
            <p className="mt-1 font-section-header text-section-header text-on-background">
              {activeReportPeak?.label ?? "None"} <span className="text-body-md font-body-md text-secondary">({activeReportPeak?.total ?? 0})</span>
            </p>
          </div>
          <div>
            <p className="font-label-caps text-label-caps text-secondary uppercase">Average</p>
            <p className="mt-1 font-section-header text-section-header text-on-background">{activeReportAverage}</p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto pb-2">
          <div
            className="min-w-[720px]"
            style={{ minWidth: reportView === "monthly" ? 760 : Math.max(560, activeReportData.length * 96) }}
          >
            <div className="grid grid-cols-[52px_1fr] gap-3">
              <div className="h-[280px] flex flex-col justify-between py-1 text-right text-[10px] font-bold text-secondary">
                {reportChartTicks.map((tick) => (
                  <span key={tick}>{Math.round(maxReportTotal * tick)}</span>
                ))}
              </div>
              <div className="relative h-[280px] border-l border-b border-outline-variant">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {reportChartTicks.map((tick, index) => (
                    <div
                      key={tick}
                      className={`${index === reportChartTicks.length - 1 ? "" : "border-t border-dashed border-outline-variant/60"} h-0`}
                    />
                  ))}
                </div>
                <div className="relative z-10 h-full flex items-end justify-between gap-3 px-4">
                  {activeReportData.map((report) => {
                    const barHeight = report.total > 0 ? Math.max(8, (report.total / maxReportTotal) * 100) : 2;
                    const segments = [
                      { key: "completed", value: report.completed, color: "#0F6E56" },
                      { key: "reprimand", value: report.reprimand, color: "#A32D2D" },
                      { key: "pending", value: report.pending, color: "#D9A23B" },
                      { key: "other", value: report.other, color: "#6B7280" },
                    ].filter((segment) => segment.value > 0);

                    return (
                      <div key={report.label} className="h-full flex-1 min-w-[42px] flex flex-col items-center justify-end">
                        <span className="mb-2 text-[10px] font-bold text-secondary">{report.total}</span>
                        <div
                          className="relative w-full max-w-[52px] rounded-t-md bg-surface-container-high border border-outline-variant/50 overflow-hidden"
                          style={{ height: `${barHeight}%` }}
                        >
                          <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col-reverse">
                            {segments.length > 0 ? segments.map((segment) => (
                              <div
                                key={segment.key}
                                style={{
                                  height: `${(segment.value / report.total) * 100}%`,
                                  backgroundColor: segment.color,
                                }}
                              />
                            )) : (
                              <div className="h-full bg-surface-container-high" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div />
              <div className="flex justify-between gap-3 px-4 pt-2">
                {activeReportData.map((report) => (
                  <span key={report.label} className="flex-1 min-w-[42px] text-center text-[10px] font-bold text-secondary">
                    {report.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#0F6E56]" />
            Resolved / Closed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#A32D2D]" />
            Reprimand ({activeReportReprimand})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#D9A23B]" />
            Pending ({activeReportPending})
          </span>
          {activeReportOther > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#6B7280]" />
              Other ({activeReportOther})
            </span>
          )}
        </div>
      </div>

      <div className="data-card overflow-hidden flex flex-col">
        <div className="p-6 border-b border-surface-variant flex justify-between items-center bg-surface-container">
          <h3 className="font-section-header text-section-header text-primary">Recent Activity Log</h3>
          <Link className="text-body-md font-body-md font-medium text-primary-container hover:text-primary transition-colors duration-500 flex items-center gap-1" to="/catalog">
            View Full Catalog <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
          </Link>
        </div>
        <div className="w-full">
          {stats.recentCases.map(caseRecord => {
            const badge = getBadgeClassAndColor(caseRecord.progress);
            return (
              <div key={caseRecord.id} className="zebra-row flex items-center justify-between px-6 py-4 border-b border-surface-variant last:border-b-0 hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-4 w-1/3">
                  <span className="inline-block px-2 py-1 bg-surface border border-outline-variant rounded-DEFAULT font-data-mono text-data-mono text-secondary">{formatCaseId(caseRecord.id)}</span>
                  <div>
                    <p className="font-body-md text-body-md font-medium text-on-background m-0">
                      {(() => {
                        const students = parseStudents(caseRecord.students);
                        if (students.length === 0) return "—";
                        const firstStudent = students[0];
                        const name = `${firstStudent.lastName}, ${firstStudent.firstName}${firstStudent.middleInitial ? ` ${firstStudent.middleInitial}.` : ""}`;
                        return students.length > 1 ? `${name} (+${students.length - 1} others)` : name;
                      })()}
                    </p>
                    <p className="font-label-caps text-label-caps text-secondary m-0 mt-0.5">
                      {(() => {
                        const students = parseStudents(caseRecord.students);
                        if (students.length === 0) return "—";
                        const firstStudent = students[0];
                        return `${firstStudent.level} • ${firstStudent.section}`;
                      })()}
                    </p>
                  </div>
                </div>
                <div className="w-1/4">
                  <p className="font-body-md text-body-md text-on-surface-variant">{caseRecord.case}</p>
                </div>
                <div className="w-1/6">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-DEFAULT ${badge.bg} ${badge.text} border ${badge.border} font-label-caps text-label-caps`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span> {caseRecord.progress}
                  </span>
                </div>
                <div className="w-1/6 text-right">
                  <p className="font-body-md text-body-md text-secondary">{formatDate(caseRecord.date_filed || caseRecord.date)}</p>
                </div>
              </div>
            );
          })}
          {stats.recentCases.length === 0 && (
            <div className="px-6 py-8 text-center text-secondary text-body-md">
                No recent activity.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
