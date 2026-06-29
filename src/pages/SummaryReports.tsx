import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import html2pdf from "html2pdf.js";
import lcOfficialLogo from "../assets/lc-official-logo.jpg";
import guidanceLogo from "../assets/guidance-logo.png";


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
  first_name: string;
  last_name: string;
  middle_initial: string;
  level: string;
  section: string;
  date: string;
  date_filed: string;
  adviser: string;
  case: string;
  description: string;
  sanction: string;
  progress: string;
  proofs: string;
  students: string;
  title: string;
}

type ReportView = "monthly" | "yearly";


const formatCaseId = (id: number) => `LC-${id.toString().padStart(4, "0")}`;

const getAcademicYearStart = (date: Date) => {
  return date.getMonth() >= 5 ? date.getFullYear() : date.getFullYear() - 1;
};

const parseYearAndMonth = (dateString: string | undefined | null): { year: number; month: number } | null => {
  if (!dateString) return null;
  const yyyymmdd = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (yyyymmdd) {
    return {
      year: parseInt(yyyymmdd[1], 10),
      month: parseInt(yyyymmdd[2], 10) - 1
    };
  }
  const mmddyyyy = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mmddyyyy) {
    return {
      year: parseInt(mmddyyyy[3], 10),
      month: parseInt(mmddyyyy[1], 10) - 1
    };
  }
  const d = new Date(dateString);
  if (!isNaN(d.getTime())) {
    return {
      year: d.getFullYear(),
      month: d.getMonth()
    };
  }
  return null;
};

const getAcademicYearStartFromStr = (dateString: string | undefined | null): number | null => {
  const parsed = parseYearAndMonth(dateString);
  if (!parsed) return null;
  return parsed.month >= 5 ? parsed.year : parsed.year - 1;
};

const formatAcademicYear = (startYear: number) => `A.Y. ${startYear}-${startYear + 1}`;

const parseStudents = (studentsStr: string): StudentInfo[] => {
  try {
    return JSON.parse(studentsStr) || [];
  } catch (e) {
    return [];
  }
};

const matchGradeLevel = (studentLevel: string | null | undefined, targetGrade: string): boolean => {
  if (!studentLevel) return false;
  const levelMatch = studentLevel.match(/\d+/);
  const targetMatch = targetGrade.match(/\d+/);
  if (levelMatch && targetMatch) {
    return levelMatch[0] === targetMatch[0];
  }
  return studentLevel.trim().toLowerCase() === targetGrade.trim().toLowerCase();
};

const formatStudentsList = (caseRecord: CaseRecord) => {
  const students = parseStudents(caseRecord.students);
  if (students.length > 0) {
    return students.map(s => `${s.lastName}, ${s.firstName}${s.middleInitial ? ` ${s.middleInitial}.` : ""}`).join("; ");
  }
  if (caseRecord.last_name || caseRecord.first_name) {
    return `${caseRecord.last_name || ""}, ${caseRecord.first_name || ""}${caseRecord.middle_initial ? ` ${caseRecord.middle_initial}.` : ""}`.trim();
  }
  return "—";
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
};interface TooltipProps {
  grade: string;
  metric: string;
  count: number;
  color: string;
}

const Tooltip = ({ grade, metric, count, color }: TooltipProps) => {
  return (
    <div 
      className="absolute z-30 bottom-[calc(100%+8px)] left-1/2 transform -translate-x-1/2 bg-[#121212] text-white py-1.5 px-3 rounded shadow-xl border border-white/10 text-left min-w-[120px] pointer-events-none select-none animate-in fade-in slide-in-from-bottom-1 duration-150"
      style={{ filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.3))" }}
    >
      <p className="font-bold text-[11px] leading-tight text-white m-0">{grade}</p>
      <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-gray-200">
        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
        <span>{metric}: {count} {count === 1 ? "case" : "cases"}</span>
      </div>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#121212]" />
    </div>
  );
};

export default function SummaryReports() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportView, setReportView] = useState<ReportView>("monthly");

  // Academic year and month selectors state
  const [selectedYear, setSelectedYear] = useState<number>(() => getAcademicYearStart(new Date()));
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(() => {
    const now = new Date();
    const month = now.getMonth();
    return month >= 5 ? month - 5 : month + 7;
  });
  const [isExporting, setIsExporting] = useState(false);

  // Hover state for interactive tooltips
  const [hoveredBar, setHoveredBar] = useState<{
    grade: string;
    metric: "reprimand" | "resolved" | "pending";
    count: number;
  } | null>(null);

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

  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    cases.forEach(c => {
      const ay = getAcademicYearStartFromStr(c.date_filed || c.date);
      if (ay !== null) {
        yearsSet.add(ay);
      }
    });
    // Ensure current academic year is always in the list
    yearsSet.add(getAcademicYearStart(new Date()));
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [cases]);

  const ACADEMIC_MONTHS = useMemo(() => [
    { offset: 0, label: "June", monthIndex: 5 },
    { offset: 1, label: "July", monthIndex: 6 },
    { offset: 2, label: "August", monthIndex: 7 },
    { offset: 3, label: "September", monthIndex: 8 },
    { offset: 4, label: "October", monthIndex: 9 },
    { offset: 5, label: "November", monthIndex: 10 },
    { offset: 6, label: "December", monthIndex: 11 },
    { offset: 7, label: "January", monthIndex: 0 },
    { offset: 8, label: "February", monthIndex: 1 },
    { offset: 9, label: "March", monthIndex: 2 },
    { offset: 10, label: "April", monthIndex: 3 },
    { offset: 11, label: "May", monthIndex: 4 },
  ], []);

  const casesInSelectedYear = useMemo(() => {
    return cases.filter(c => {
      const ay = getAcademicYearStartFromStr(c.date_filed || c.date);
      return ay === selectedYear;
    });
  }, [cases, selectedYear]);

  const casesInSelectedMonth = useMemo(() => {
    return casesInSelectedYear.filter(c => {
      const parsed = parseYearAndMonth(c.date_filed || c.date);
      if (!parsed) return false;
      const offset = parsed.month >= 5 ? parsed.month - 5 : parsed.month + 7;
      return offset === selectedMonthOffset;
    });
  }, [casesInSelectedYear, selectedMonthOffset]);

  const activeCases = useMemo(() => {
    return reportView === "monthly" ? casesInSelectedMonth : casesInSelectedYear;
  }, [reportView, casesInSelectedMonth, casesInSelectedYear]);

  const allTimeStats = useMemo(() => {
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

    const recentCases = [...cases]
      .sort((a, b) => new Date(b.date_filed || b.date).getTime() - new Date(a.date_filed || a.date).getTime())
      .slice(0, 5);

    return {
      total,
      pending,
      resolved,
      resolutionRate,
      mostCommonType,
      mostCommonPercentage,
      recentCases,
    };
  }, [cases]);

  const activeStats = useMemo(() => {
    const total = activeCases.length;
    const pending = activeCases.filter(c => c.progress.toLowerCase() === "pending").length;
    const completed = activeCases.filter(c => {
      const p = c.progress.toLowerCase();
      return p === "resolved" || p === "closed" || p.includes("reprimand");
    }).length;
    const reprimand = activeCases.filter(c => c.progress.toLowerCase().includes("reprimand")).length;
    const other = total - pending - completed;

    return {
      total,
      completed,
      pending,
      reprimand,
      other,
    };
  }, [activeCases]);

  const gradeLevelChartData = useMemo(() => {
    const grades = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
    return grades.map((grade) => {
      const gradeCases = activeCases.filter((c) => {
        const students = parseStudents(c.students);
        if (students.length > 0) {
          return students.some((s) => matchGradeLevel(s.level, grade));
        }
        return matchGradeLevel(c.level, grade);
      });
      const filed = gradeCases.length;
      const reprimand = gradeCases.filter((c) => c.progress.toLowerCase().includes("reprimand")).length;
      const pending = gradeCases.filter((c) => c.progress.toLowerCase() === "pending").length;
      const resolved = gradeCases.filter((c) => {
        const prog = c.progress.toLowerCase();
        return prog === "resolved" || prog === "closed";
      }).length;
      return {
        label: grade,
        filed,
        reprimand,
        resolved,
        pending,
      };
    });
  }, [activeCases]);

  const maxGradeCases = useMemo(() => {
    const counts = gradeLevelChartData.map((g) => Math.max(g.reprimand, g.resolved, g.pending));
    return Math.max(3, ...counts);
  }, [gradeLevelChartData]);

  const chartTicks = useMemo(() => {
    const max = maxGradeCases;
    if (max <= 5) {
      return Array.from({ length: max + 1 }, (_, i) => max - i);
    }
    const step = Math.ceil(max / 4);
    return [max, max - step, max - 2 * step, max - 3 * step, 0].map((v) => Math.max(0, v));
  }, [maxGradeCases]);

  const timeframeStats = useMemo(() => {
    const peak = gradeLevelChartData.reduce(
      (p, c) => (c.filed > p.filed ? c : p),
      { label: "None", filed: 0 }
    );
    const total = activeCases.length;
    const resRate = total > 0 ? ((activeStats.completed / total) * 100).toFixed(1) : "0.0";
    const average = (total / 12).toFixed(1);
    return {
      peak,
      resRate,
      average,
    };
  }, [gradeLevelChartData, activeCases, activeStats]);

  const selectedMonthName = useMemo(() => {
    const year = selectedYear + (selectedMonthOffset + 5 >= 12 ? 1 : 0);
    const month = (selectedMonthOffset + 5) % 12;
    return new Date(year, month, 1).toLocaleDateString(undefined, { month: "long" });
  }, [selectedYear, selectedMonthOffset]);

  const selectedAcademicYearLabel = formatAcademicYear(selectedYear);

  const handleExportPDF = () => {
    if (isExporting || activeCases.length === 0) return;
    setIsExporting(true);
  };

  useEffect(() => {
    if (!isExporting) return;

    let isMounted = true;
    const runExport = async () => {
      const element = document.querySelector("#report-pdf-document") as HTMLElement;
      if (!element) {
        setIsExporting(false);
        return;
      }

      const timeframeLabel = reportView === "monthly"
        ? `${selectedMonthName}_${selectedMonthOffset >= 7 ? selectedYear + 1 : selectedYear}`
        : `${selectedAcademicYearLabel.replace(/\s+/g, "_")}`;

      const filename = `Guidance_Report_${timeframeLabel}.pdf`;
      const opt = {
        margin: [0.5, 0.5] as [number, number],
        filename,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          onclone: (clonedDocument: Document) => {
            clonedDocument.documentElement.classList.remove("dark");
            const clonedTarget = clonedDocument.querySelector("#report-pdf-document") as HTMLElement;
            if (clonedTarget) {
              clonedTarget.style.position = "static";
              clonedTarget.style.left = "0";
              clonedTarget.style.top = "0";
              clonedTarget.style.width = "100%";
            }
          },
        },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" as const },
        pagebreak: { mode: ["css", "legacy"] }
      };

      try {
        const pdfBase64 = await html2pdf().from(element).set(opt).outputPdf("datauristring");
        if (isMounted) {
          const base64Data = pdfBase64.split(",")[1];
          await invoke("save_pdf", { base64Data, filename });
        }
      } catch (err) {
        alert("Failed to export PDF: " + err);
      } finally {
        if (isMounted) {
          setIsExporting(false);
        }
      }
    };

    const timer = setTimeout(() => {
      runExport();
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isExporting, reportView, selectedMonthName, selectedMonthOffset, selectedYear, selectedAcademicYearLabel]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="data-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-label-caps text-secondary uppercase">Total Cases</span>
            <span className="material-symbols-outlined text-primary-container bg-secondary-container dark:bg-[#1E293B] dark:text-[#3B82F6] p-1.5 rounded-DEFAULT" style={{ fontSize: '20px' }}>folder</span>
          </div>
          <div>
            <h3 className="font-display-title text-display-title text-on-background m-0 leading-none">{isLoading ? "..." : allTimeStats.total}</h3>
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
            <h3 className="font-display-title text-display-title text-on-background m-0 leading-none">{isLoading ? "..." : allTimeStats.pending}</h3>
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
            <h3 className="font-display-title text-display-title text-on-background m-0 leading-none">{isLoading ? "..." : allTimeStats.resolved}</h3>
            <p className="text-body-md font-body-md text-secondary mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: '16px' }}>check</span>
              <span className="text-secondary font-medium">{allTimeStats.resolutionRate}% resolution rate</span>
            </p>
          </div>
        </div>
        <div className="data-card p-6 flex flex-col justify-between bg-primary-fixed dark:bg-surface border-primary-fixed-dim dark:border-outline-variant">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-label-caps text-on-primary-fixed dark:text-secondary uppercase">Most Common Type</span>
            <span className="material-symbols-outlined text-primary bg-surface dark:bg-transparent dark:text-[#3B82F6] p-1.5 rounded-DEFAULT" style={{ fontSize: '20px' }}>warning</span>
          </div>
          <div>
            <h3 className="font-section-header text-section-header text-primary dark:text-[#3B82F6] m-0 leading-tight line-clamp-1">{isLoading ? "..." : allTimeStats.mostCommonType}</h3>
            <p className="text-body-md font-body-md text-on-primary-fixed-variant dark:text-on-surface mt-2 flex items-center gap-1">
              <span className="font-semibold">{allTimeStats.mostCommonPercentage}%</span> of all cases
            </p>
          </div>
        </div>
      </div>

      <div className="data-card p-6 flex flex-col mt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b border-surface-variant pb-5">
          <div>
            <h3 className="font-section-header text-section-header text-primary">Monthly & Yearly Reports</h3>
            <p className="text-body-md font-body-md text-secondary mt-1">
              {reportView === "monthly"
                ? `${selectedMonthName} ${selectedMonthOffset >= 7 ? selectedYear + 1 : selectedYear} activity`
                : `${selectedAcademicYearLabel} activity`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Academic Year Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Academic Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs font-bold text-on-surface focus:outline-none focus:border-primary cursor-pointer transition-colors duration-300"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {formatAcademicYear(year)}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Dropdown (Monthly view only) */}
            {reportView === "monthly" && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Month</label>
                <select
                  value={selectedMonthOffset}
                  onChange={(e) => setSelectedMonthOffset(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs font-bold text-on-surface focus:outline-none focus:border-primary cursor-pointer transition-colors duration-300"
                >
                  {ACADEMIC_MONTHS.map((m) => (
                    <option key={m.offset} value={m.offset}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Monthly / Yearly Toggle */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">View Mode</label>
              <div className="inline-flex overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low">
                {([
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Yearly" },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setReportView(option.value)}
                    className={`px-3 py-1.5 text-xs font-bold transition-colors duration-500 ${
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

            {/* Export PDF Button */}
            <div className="flex flex-col gap-1 self-end">
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={isExporting || activeCases.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary-container text-on-primary-container border border-primary-fixed-dim hover:bg-primary hover:text-on-primary disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-lg transition-colors duration-300"
              >
                <span className="material-symbols-outlined text-sm">
                  {isExporting ? "sync" : "picture_as_pdf"}
                </span>
                {isExporting ? "Exporting..." : "Export PDF"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-stretch">
          {/* Stats Cards Column */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Filed Cases Card */}
            <div className="flex-1 bg-surface-container-low border border-outline-variant/60 rounded-xl p-5 flex flex-col justify-between min-h-[90px]">
              <span className="font-label-caps text-label-caps text-secondary uppercase text-[10px] tracking-widest font-bold">Filed Cases</span>
              <h3 className="text-3xl font-bold text-on-background m-0 mt-2 leading-none">{activeStats.total}</h3>
            </div>
            
            {/* Completed Card */}
            <div className="flex-1 bg-surface-container-low border border-outline-variant/60 rounded-xl p-5 flex flex-col justify-between min-h-[90px]">
              <span className="font-label-caps text-label-caps text-secondary uppercase text-[10px] tracking-widest font-bold">Completed</span>
              <h3 className="text-3xl font-bold text-[#0F6E56] dark:text-[#34A06A] m-0 mt-2 leading-none">{activeStats.completed}</h3>
            </div>
            
            {/* Peak Grade Card */}
            <div className="flex-1 bg-surface-container-low border border-outline-variant/60 rounded-xl p-5 flex flex-col justify-between min-h-[90px]">
              <span className="font-label-caps text-label-caps text-secondary uppercase text-[10px] tracking-widest font-bold">Peak Grade</span>
              <h3 className="text-2xl font-bold text-on-background m-0 mt-2 leading-none truncate" title={timeframeStats.peak.filed > 0 ? `${timeframeStats.peak.label} (${timeframeStats.peak.filed} cases)` : "None"}>
                {timeframeStats.peak.filed > 0 ? `${timeframeStats.peak.label} (${timeframeStats.peak.filed})` : "None"}
              </h3>
            </div>
            
            {/* Resolution Rate Card */}
            <div className="flex-1 bg-surface-container-low border border-outline-variant/60 rounded-xl p-5 flex flex-col justify-between min-h-[90px]">
              <span className="font-label-caps text-label-caps text-secondary uppercase text-[10px] tracking-widest font-bold">
                {reportView === "monthly" ? "Res. Rate" : "Average"}
              </span>
              <h3 className="text-3xl font-bold text-on-background m-0 mt-2 leading-none">
                {reportView === "monthly" ? `${timeframeStats.resRate}%` : `${timeframeStats.average} / mo`}
              </h3>
            </div>
          </div>

          {/* Grouped Vertical Bar Chart Area */}
          <div className="lg:col-span-9 border border-outline-variant/60 rounded-xl bg-surface-container-low p-6 flex flex-col justify-between">
            <div className="flex flex-col">
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest text-[10px] font-bold">Distribution</span>
              <h4 className="text-base font-bold text-on-surface mt-1 mb-4">Cases by year level</h4>
              
              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-semibold text-secondary mb-4 border-b border-surface-variant/30 pb-3">
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-[#ff5722]" /> Reprimand
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-[#10b981]" /> Resolved
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-[#f59e0b]" /> Pending
                </span>
              </div>
            </div>

            {/* Chart Graphic container */}
            {activeCases.length > 0 ? (
              <div className="relative h-[290px] select-none w-full mt-2">
                {/* Y-axis Ticks & Horizontal Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {chartTicks.map((tick, index) => (
                    <div key={tick} className="w-full flex items-center gap-3">
                      <span className="w-6 text-[10px] font-bold text-secondary text-right">{tick}</span>
                      <div className={`flex-1 ${index === chartTicks.length - 1 ? "border-t border-outline-variant" : "border-t border-dashed border-outline-variant/40"} h-0`} />
                    </div>
                  ))}
                </div>

                {/* Vertical Bars Area */}
                <div className="absolute inset-y-0 left-9 right-0 flex items-end justify-between px-4 pb-6 h-full w-[calc(100%-36px)]">
                  {gradeLevelChartData.map((grade) => {
                    const reprimandHeight = grade.reprimand > 0 ? (grade.reprimand / maxGradeCases) * 100 : 0;
                    const resolvedHeight = grade.resolved > 0 ? (grade.resolved / maxGradeCases) * 100 : 0;
                    const pendingHeight = grade.pending > 0 ? (grade.pending / maxGradeCases) * 100 : 0;

                    return (
                      <div key={grade.label} className="h-full flex-1 flex flex-col items-center justify-end relative max-w-[120px]">
                        {/* Grouped bars */}
                        <div className="w-full flex items-end justify-center gap-2.5 h-[calc(100%-24px)] relative mb-2">
                          {/* Reprimand Bar (Blue) */}
                          <div 
                            className="w-[16px] bg-[#ff5722] rounded-t-sm transition-all duration-300 hover:brightness-110 relative"
                            style={{ height: `${reprimandHeight}%` }}
                            onMouseEnter={() => setHoveredBar({ grade: grade.label, metric: 'reprimand', count: grade.reprimand })}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            {hoveredBar?.grade === grade.label && hoveredBar.metric === 'reprimand' && (
                              <Tooltip grade={grade.label} metric="Reprimand" count={grade.reprimand} color="#ff5722" />
                            )}
                          </div>

                          {/* Resolved Bar (Green) */}
                          <div 
                            className="w-[16px] bg-[#10b981] rounded-t-sm transition-all duration-300 hover:brightness-110 relative"
                            style={{ height: `${resolvedHeight}%` }}
                            onMouseEnter={() => setHoveredBar({ grade: grade.label, metric: 'resolved', count: grade.resolved })}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            {hoveredBar?.grade === grade.label && hoveredBar.metric === 'resolved' && (
                              <Tooltip grade={grade.label} metric="Resolved" count={grade.resolved} color="#10b981" />
                            )}
                          </div>

                          {/* Pending Bar (Orange) */}
                          <div 
                            className="w-[16px] bg-[#f59e0b] rounded-t-sm transition-all duration-300 hover:brightness-110 relative"
                            style={{ height: `${pendingHeight}%` }}
                            onMouseEnter={() => setHoveredBar({ grade: grade.label, metric: 'pending', count: grade.pending })}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            {hoveredBar?.grade === grade.label && hoveredBar.metric === 'pending' && (
                              <Tooltip grade={grade.label} metric="Pending" count={grade.pending} color="#f59e0b" />
                            )}
                          </div>
                        </div>

                        {/* Label (Centered, not rotated) */}
                        <span className="absolute bottom-[-16px] text-[10px] font-bold text-secondary text-center w-full whitespace-nowrap">
                          {grade.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-secondary text-body-md border border-dashed border-outline-variant/60 rounded-xl my-4">
                No activity records found for this timeframe.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Cases Table */}
      <div className="data-card overflow-hidden flex flex-col mt-6">
        <div className="p-6 border-b border-surface-variant flex justify-between items-center bg-surface-container">
          <h3 className="font-section-header text-section-header text-primary">
            {reportView === "monthly" 
              ? `${selectedMonthName} ${selectedMonthOffset >= 7 ? selectedYear + 1 : selectedYear} Cases Log`
              : `${selectedAcademicYearLabel} Cases Log`}
          </h3>
          <span className="text-body-md font-body-md text-secondary font-semibold">
            {activeCases.length} {activeCases.length === 1 ? "case" : "cases"} found
          </span>
        </div>
        <div className="w-full overflow-x-auto">
          {activeCases.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low text-label-caps font-label-caps text-secondary text-xs">
                  <th className="px-6 py-3.5">Case ID</th>
                  <th className="px-6 py-3.5">Student(s)</th>
                  <th className="px-6 py-3.5">Level & Section</th>
                  <th className="px-6 py-3.5">Case Category</th>
                  <th className="px-6 py-3.5">Progress</th>
                  <th className="px-6 py-3.5 text-right">Date Filed</th>
                </tr>
              </thead>
              <tbody>
                {activeCases.map((caseRecord) => {
                  const badge = getBadgeClassAndColor(caseRecord.progress);
                  return (
                    <tr key={caseRecord.id} className="border-b border-outline-variant/20 last:border-b-0 hover:bg-surface-container-low transition-colors duration-300">
                      <td className="px-6 py-4">
                        <Link to={`/case/${caseRecord.id}`} className="inline-block px-2.5 py-1 bg-surface border border-outline-variant rounded-DEFAULT font-data-mono text-data-mono text-secondary hover:text-primary hover:border-primary transition-colors">
                          {formatCaseId(caseRecord.id)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-medium text-on-background">
                        {formatStudentsList(caseRecord)}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">
                        {(() => {
                          const students = parseStudents(caseRecord.students);
                          if (students.length > 0) {
                            return `${students[0].level} • ${students[0].section}`;
                          }
                          if (caseRecord.level || caseRecord.section) {
                            return `${caseRecord.level || "—"} • ${caseRecord.section || "—"}`;
                          }
                          return "—";
                        })()}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">
                        {caseRecord.case}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-DEFAULT ${badge.bg} ${badge.text} border ${badge.border} font-label-caps text-label-caps`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span> {caseRecord.progress}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-secondary">
                        {formatDate(caseRecord.date_filed || caseRecord.date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center text-secondary text-body-md">
              No cases recorded for this timeframe.
            </div>
          )}
        </div>
      </div>

      <div className="data-card overflow-hidden flex flex-col mt-6">
        <div className="p-6 border-b border-surface-variant flex justify-between items-center bg-surface-container">
          <h3 className="font-section-header text-section-header text-primary">Recent Activity Log (All Time)</h3>
          <Link className="text-body-md font-body-md font-medium text-primary-container hover:text-primary transition-colors duration-500 flex items-center gap-1" to="/catalog">
            View Full Catalog <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
          </Link>
        </div>
        <div className="w-full">
          {allTimeStats.recentCases.map(caseRecord => {
            const badge = getBadgeClassAndColor(caseRecord.progress);
            return (
              <div key={caseRecord.id} className="zebra-row flex items-center justify-between px-6 py-4 border-b border-surface-variant last:border-b-0 hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-4 w-1/3">
                  <span className="inline-block px-2 py-1 bg-surface border border-outline-variant rounded-DEFAULT font-data-mono text-data-mono text-secondary">{formatCaseId(caseRecord.id)}</span>
                  <div>
                    <p className="font-body-md text-body-md font-medium text-on-background m-0">
                      {(() => {
                        const students = parseStudents(caseRecord.students);
                        if (students.length > 0) {
                          const firstStudent = students[0];
                          const name = `${firstStudent.lastName}, ${firstStudent.firstName}${firstStudent.middleInitial ? ` ${firstStudent.middleInitial}.` : ""}`;
                          return students.length > 1 ? `${name} (+${students.length - 1} others)` : name;
                        }
                        if (caseRecord.last_name || caseRecord.first_name) {
                          return `${caseRecord.last_name || ""}, ${caseRecord.first_name || ""}${caseRecord.middle_initial ? ` ${caseRecord.middle_initial}.` : ""}`.trim();
                        }
                        return "—";
                      })()}
                    </p>
                    <p className="font-label-caps text-label-caps text-secondary m-0 mt-0.5">
                      {(() => {
                        const students = parseStudents(caseRecord.students);
                        if (students.length > 0) {
                          const firstStudent = students[0];
                          return `${firstStudent.level} • ${firstStudent.section}`;
                        }
                        if (caseRecord.level || caseRecord.section) {
                          return `${caseRecord.level || "—"} • ${caseRecord.section || "—"}`;
                        }
                        return "—";
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
          {allTimeStats.recentCases.length === 0 && (
            <div className="px-6 py-8 text-center text-secondary text-body-md">
                No recent activity.
            </div>
          )}
        </div>
      </div>

      {/* Hidden print-only container for PDF generation */}
      <div
        id="report-pdf-document"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          width: "790px",
          backgroundColor: "#ffffff",
          color: "#000000",
          fontFamily: "Georgia, 'Times New Roman', serif",
          padding: "32px",
          boxSizing: "border-box",
        }}
      >
        {/* Letterhead */}
        <div style={{ borderBottom: "2px solid #000000", paddingBottom: "16px", marginBottom: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 80px", alignItems: "center", gap: "16px" }}>
            <img src={lcOfficialLogo} alt="Laguna College Logo" style={{ width: "70px", height: "70px", objectFit: "contain" }} />
            <div style={{ textAlign: "center" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", color: "#000000" }}>LAGUNA COLLEGE</h2>
              <p style={{ margin: "2px 0 0", fontSize: "11px", fontWeight: "bold", color: "#000000" }}>San Pablo City</p>
              <h3 style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: "bold", color: "#000000" }}>Guidance Office</h3>
            </div>
            <img src={guidanceLogo} alt="Guidance Office Logo" style={{ width: "70px", height: "70px", objectFit: "contain" }} />
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", textTransform: "uppercase", color: "#000000" }}>
            {reportView === "monthly" ? "Monthly Guidance Cases Report" : "Annual Guidance Cases Report"}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", fontWeight: "normal", color: "#4b5563" }}>
            {reportView === "monthly"
              ? `Report for the Month of ${selectedMonthName} (School Year ${selectedAcademicYearLabel})`
              : `Report for Academic Year ${selectedAcademicYearLabel}`}
          </p>
        </div>

        {/* Statistics Summary Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
          <div style={{ border: "1px solid #d1d5db", padding: "12px", borderRadius: "6px", backgroundColor: "#f9fafb" }}>
            <p style={{ margin: 0, fontSize: "9px", color: "#6b7280", textTransform: "uppercase", fontWeight: "bold" }}>Total Cases</p>
            <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: "bold", color: "#111827" }}>{activeStats.total}</p>
          </div>
          <div style={{ border: "1px solid #d1d5db", padding: "12px", borderRadius: "6px", backgroundColor: "#f9fafb" }}>
            <p style={{ margin: 0, fontSize: "9px", color: "#6b7280", textTransform: "uppercase", fontWeight: "bold" }}>Resolved / Closed</p>
            <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: "bold", color: "#0F6E56" }}>{activeStats.completed}</p>
          </div>
          <div style={{ border: "1px solid #d1d5db", padding: "12px", borderRadius: "6px", backgroundColor: "#f9fafb" }}>
            <p style={{ margin: 0, fontSize: "9px", color: "#6b7280", textTransform: "uppercase", fontWeight: "bold" }}>Pending Action</p>
            <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: "bold", color: "#D9A23B" }}>{activeStats.pending}</p>
          </div>
          <div style={{ border: "1px solid #d1d5db", padding: "12px", borderRadius: "6px", backgroundColor: "#f9fafb" }}>
            <p style={{ margin: 0, fontSize: "9px", color: "#6b7280", textTransform: "uppercase", fontWeight: "bold" }}>
              {reportView === "monthly" ? "Resolution Rate" : "Average Cases / Mo"}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: "bold", color: "#111827" }}>
              {reportView === "monthly" ? `${timeframeStats.resRate}%` : timeframeStats.average}
            </p>
          </div>
        </div>

        {/* Visual Graph Section (Cases by Year Level) */}
        <div style={{ border: "1px solid #d1d5db", borderRadius: "6px", padding: "16px", marginBottom: "24px" }}>
          <h4 style={{ margin: "0 0 16px", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", color: "#374151" }}>
            Cases by year level (Distribution)
          </h4>

          {gradeLevelChartData.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {gradeLevelChartData.map((grade) => {
                const maxVal = Math.max(1, ...gradeLevelChartData.map(g => Math.max(g.reprimand, g.resolved, g.pending)));
                const reprimandWidth = (grade.reprimand / maxVal) * 100;
                const resolvedWidth = (grade.resolved / maxVal) * 100;
                const pendingWidth = (grade.pending / maxVal) * 100;

                return (
                  <div key={grade.label} style={{ display: "grid", gridTemplateColumns: "80px 1fr", alignItems: "center", gap: "12px", fontSize: "10px" }}>
                    <span style={{ fontWeight: "bold", color: "#4b5563" }}>{grade.label}</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      {grade.reprimand > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ height: "6px", width: `${reprimandWidth}%`, backgroundColor: "#ff5722", borderRadius: "2px" }} />
                          <span style={{ fontSize: "8px", color: "#6b7280" }}>Reprimand: {grade.reprimand}</span>
                        </div>
                      )}
                      {grade.resolved > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ height: "6px", width: `${resolvedWidth}%`, backgroundColor: "#10b981", borderRadius: "2px" }} />
                          <span style={{ fontSize: "8px", color: "#6b7280" }}>Resolved: {grade.resolved}</span>
                        </div>
                      )}
                      {grade.pending > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ height: "6px", width: `${pendingWidth}%`, backgroundColor: "#f59e0b", borderRadius: "2px" }} />
                          <span style={{ fontSize: "8px", color: "#6b7280" }}>Pending: {grade.pending}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: "11px", color: "#6b7280", textAlign: "center" }}>No chart data available for this period.</p>
          )}

          {/* Chart Legend */}
          <div style={{ display: "flex", gap: "16px", marginTop: "16px", fontSize: "9px", fontWeight: "bold", borderTop: "1px solid #f3f4f6", paddingTop: "8px", color: "#000000" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#ff5722" }} /> Reprimand
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#10b981" }} /> Resolved
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#f59e0b" }} /> Pending
            </span>
          </div>
        </div>

        {/* Detailed Table */}
        <div style={{ marginBottom: "32px" }}>
          <h4 style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", color: "#374151" }}>
            Case Logs Detail Table
          </h4>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "1px solid #d1d5db", color: "#000000" }}>
                <th style={{ padding: "8px", fontWeight: "bold" }}>Case ID</th>
                <th style={{ padding: "8px", fontWeight: "bold" }}>Student Name(s)</th>
                <th style={{ padding: "8px", fontWeight: "bold" }}>Level & Section</th>
                <th style={{ padding: "8px", fontWeight: "bold" }}>Category</th>
                <th style={{ padding: "8px", fontWeight: "bold" }}>Status</th>
                <th style={{ padding: "8px", fontWeight: "bold", textAlign: "right" }}>Date Filed</th>
              </tr>
            </thead>
            <tbody>
              {activeCases.map((caseRecord) => {
                const students = parseStudents(caseRecord.students);
                const progressColor = caseRecord.progress.toLowerCase() === "resolved" || caseRecord.progress.toLowerCase() === "closed"
                  ? "#0F6E56"
                  : caseRecord.progress.toLowerCase().includes("reprimand")
                  ? "#A32D2D"
                  : "#D9A23B";

                return (
                  <tr key={caseRecord.id} style={{ borderBottom: "1px solid #e5e7eb", color: "#000000" }}>
                    <td style={{ padding: "8px", fontFamily: "monospace" }}>{formatCaseId(caseRecord.id)}</td>
                    <td style={{ padding: "8px", fontWeight: "bold" }}>
                      {formatStudentsList(caseRecord)}
                    </td>
                    <td style={{ padding: "8px" }}>
                      {(() => {
                        if (students.length > 0) {
                          return `${students[0].level} - ${students[0].section}`;
                        }
                        if (caseRecord.level || caseRecord.section) {
                          return `${caseRecord.level || "—"} - ${caseRecord.section || "—"}`;
                        }
                        return "—";
                      })()}
                    </td>
                    <td style={{ padding: "8px" }}>{caseRecord.case}</td>
                    <td style={{ padding: "8px", color: progressColor, fontWeight: "bold" }}>{caseRecord.progress}</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>
                      {new Date(caseRecord.date_filed || caseRecord.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
              {activeCases.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
                    No cases recorded for this timeframe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", fontSize: "11px", color: "#000000" }}>
          <div>
            <p style={{ margin: 0 }}>Prepared by:</p>
            <div style={{ marginTop: "40px", borderTop: "1px solid #000000", width: "200px", textAlign: "center" }}>
              <p style={{ margin: "4px 0 0", fontWeight: "bold" }}>Guidance Counselor</p>
            </div>
          </div>
          <div>
            <p style={{ margin: 0 }}>Approved by:</p>
            <div style={{ marginTop: "40px", borderTop: "1px solid #000000", width: "200px", textAlign: "center" }}>
              <p style={{ margin: "4px 0 0", fontWeight: "bold" }}>School Principal / Director</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: "center", marginTop: "30px", borderTop: "1px solid #e5e7eb", paddingTop: "8px", fontSize: "9px", color: "#9ca3af" }}>
          Laguna College Guidance Cases Management System • Generated on {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </>
  );
}


