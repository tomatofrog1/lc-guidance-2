import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";

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

const formatCaseId = (id: number) => `LC-${id.toString().padStart(4, "0")}`;

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
    
    const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
    const topTypes = sortedTypes.slice(0, 4).map(t => ({
      name: t[0],
      count: t[1],
      percentage: ((t[1] / total) * 100).toFixed(0)
    }));
    
    const recentCases = [...cases].sort((a, b) => new Date(b.date_filed || b.date).getTime() - new Date(a.date_filed || a.date).getTime()).slice(0, 5);

    const monthCounts: Record<string, number> = {};
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = d.toLocaleDateString(undefined, { month: 'short' });
        months.push(monthName);
        monthCounts[monthName] = 0;
    }
    
    cases.forEach(c => {
        const d = new Date(c.date_filed || c.date);
        if (!isNaN(d.getTime())) {
            const m = d.toLocaleDateString(undefined, { month: 'short' });
            if (monthCounts[m] !== undefined) {
                monthCounts[m]++;
            }
        }
    });
    
    const trendData = months.map(m => monthCounts[m]);
    const maxTrend = Math.max(...trendData, 10);
    
    const points = trendData.map((val, i) => {
        const x = (i / 5) * 800;
        const y = 250 - ((val / maxTrend) * 220); 
        return `${x},${y}`;
    }).join(" ");
    
    const trendPoints = trendData.map((val, i) => {
        return {
            x: (i / 5) * 800,
            y: 250 - ((val / maxTrend) * 220),
            val
        };
    });

    return {
      total,
      pending,
      resolved,
      resolutionRate,
      mostCommonType,
      mostCommonPercentage,
      topTypes,
      recentCases,
      trendData,
      months,
      trendPolyline: points,
      trendPoints
    };
  }, [cases]);

  const typeColors = [
      { bg: 'bg-primary', hex: '#002f87' },
      { bg: 'bg-primary-container', hex: '#dbe1ff' },
      { bg: 'bg-surface-tint', hex: '#3a59b1' },
      { bg: 'bg-on-primary-container', hex: '#001443' }
  ];

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="data-card p-6 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-section-header text-section-header text-primary">Filing Volume Trend (Last 6 Months)</h3>
            <button className="text-secondary hover:text-primary transition-colors">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>
          <div className="flex-grow relative w-full min-h-[300px] flex items-end pt-8">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 300">
              <line stroke="#E2E2E2" strokeDasharray="4" strokeWidth="1" x1="0" x2="800" y1="50" y2="50"></line>
              <line stroke="#E2E2E2" strokeDasharray="4" strokeWidth="1" x1="0" x2="800" y1="125" y2="125"></line>
              <line stroke="#E2E2E2" strokeDasharray="4" strokeWidth="1" x1="0" x2="800" y1="200" y2="200"></line>
              <line stroke="#E2E2E2" strokeWidth="1" x1="0" x2="800" y1="275" y2="275"></line>
              <defs>
                <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#002f87" stopOpacity="0.2"></stop>
                  <stop offset="100%" stopColor="#002f87" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              <polygon points={`0,275 ${stats.trendPolyline} 800,275`} fill="url(#areaGrad)"></polygon>
              <polyline points={stats.trendPolyline} fill="none" stroke="#002f87" strokeWidth="3"></polyline>
              {stats.trendPoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} fill="#ffffff" r="4" stroke="#002f87" strokeWidth="2"></circle>
              ))}
            </svg>
            <div className="absolute bottom-0 left-0 w-full flex justify-between text-body-md font-body-md text-secondary px-4 mt-2 -mb-6">
              {stats.months.map((m, i) => (
                  <span key={i}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="data-card p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-section-header text-section-header text-primary">Case Distribution</h3>
            <button className="text-secondary hover:text-primary transition-colors">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>
          <div className="flex-grow flex flex-col justify-center items-center">
            <div className="relative w-48 h-48 rounded-full border-[24px] border-surface-container flex items-center justify-center mb-6" style={{ borderTopColor: typeColors[3]?.hex, borderRightColor: typeColors[0]?.hex, borderBottomColor: typeColors[1]?.hex, borderLeftColor: typeColors[2]?.hex, transform: 'rotate(-45deg)' }}>
              <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'rotate(45deg)' }}>
                <div className="text-center">
                  <span className="block font-display-title text-display-title text-on-background leading-none">100%</span>
                  <span className="block font-label-caps text-label-caps text-secondary mt-1">TOTAL</span>
                </div>
              </div>
            </div>
            <div className="w-full flex flex-col gap-3">
              {stats.topTypes.map((type, i) => (
                  <div key={type.name} className="flex items-center justify-between text-body-md font-body-md">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-sm ${typeColors[i % typeColors.length].bg}`}></div>
                      <span className="text-on-background line-clamp-1">{type.name}</span>
                    </div>
                    <span className="font-medium text-secondary">{type.percentage}%</span>
                  </div>
              ))}
              {stats.topTypes.length === 0 && (
                  <div className="text-center text-secondary text-body-md">No case data</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="data-card overflow-hidden flex flex-col">
        <div className="p-6 border-b border-surface-variant flex justify-between items-center bg-surface-container">
          <h3 className="font-section-header text-section-header text-primary">Recent Activity Log</h3>
          <Link className="text-body-md font-body-md font-medium text-primary-container hover:text-primary transition-colors flex items-center gap-1" to="/catalog">
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
                      {caseRecord.last_name}, {caseRecord.first_name}{caseRecord.middle_initial ? ` ${caseRecord.middle_initial}.` : ""}
                    </p>
                    <p className="font-label-caps text-label-caps text-secondary m-0 mt-0.5">{caseRecord.level} • {caseRecord.section}</p>
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
