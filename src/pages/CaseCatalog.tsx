import { useNavigate } from "react-router-dom";

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

  return (
    <>
      <div className="flex justify-between items-end mb-6">
        <h2 className="font-section-header text-section-header text-on-surface">Case Catalog</h2>
        <div className="flex gap-3">
          <div className="relative">
            <select className="appearance-none bg-surface-container hover:bg-surface-container-high transition-colors border border-outline-variant rounded-full pl-4 pr-10 py-1.5 font-body-md text-sm text-on-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
              <option>All Types</option>
              <option>Academic</option>
              <option>Behavioral</option>
              <option>Attendance</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>expand_more</span>
            </div>
          </div>
          <div className="relative">
            <select className="appearance-none bg-surface-container hover:bg-surface-container-high transition-colors border border-outline-variant rounded-full pl-4 pr-10 py-1.5 font-body-md text-sm text-on-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
              <option>All Statuses</option>
              <option>Pending</option>
              <option>Resolved</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>expand_more</span>
            </div>
          </div>
          <div className="relative">
            <select className="appearance-none bg-surface-container hover:bg-surface-container-high transition-colors border border-outline-variant rounded-full pl-4 pr-10 py-1.5 font-body-md text-sm text-on-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Semester</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>expand_more</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface border border-surface-variant rounded-lg p-5 border-t-4 border-t-secondary-container shadow-sm">
          <h3 className="font-body-md text-on-surface-variant text-sm mb-1">Total Active Cases</h3>
          <div className="font-data-mono text-display-title text-on-surface mt-2">{isLoading ? "..." : stats.totalActiveCases}</div>
        </div>
        <div className="bg-surface border border-surface-variant rounded-lg p-5 border-t-4 border-t-[#f59e0b] shadow-sm">
          <h3 className="font-body-md text-on-surface-variant text-sm mb-1">Pending Review</h3>
          <div className="font-data-mono text-display-title text-on-surface mt-2">{isLoading ? "..." : stats.pendingReview}</div>
        </div>
        <div className="bg-surface border border-surface-variant rounded-lg p-5 border-t-4 border-t-[#22c55e] shadow-sm">
          <h3 className="font-body-md text-on-surface-variant text-sm mb-1">Resolved (30d)</h3>
          <div className="font-data-mono text-display-title text-on-surface mt-2">{isLoading ? "..." : stats.resolvedLast30Days}</div>
        </div>
        <div className="bg-surface border border-surface-variant rounded-lg p-5 border-t-4 border-t-[#ef4444] shadow-sm">
          <h3 className="font-body-md text-on-surface-variant text-sm mb-1">Active Reprimands</h3>
          <div className="font-data-mono text-display-title text-on-surface mt-2">{isLoading ? "..." : stats.activeReprimands}</div>
        </div>
      </div>

      <div className="bg-surface border border-surface-variant rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container border-b border-surface-variant font-section-header text-sm text-on-surface">
                <th className="p-table-cell-padding font-semibold">ID</th>
                <th className="p-table-cell-padding font-semibold">Date</th>
                <th className="p-table-cell-padding font-semibold">Student Name</th>
                <th className="p-table-cell-padding font-semibold">Case Type</th>
                <th className="p-table-cell-padding font-semibold">Status</th>
                <th className="p-table-cell-padding font-semibold">Reported By</th>
                <th className="p-table-cell-padding font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-sm text-on-surface">
              {isLoading && (
                <tr>
                  <td className="p-table-cell-padding text-on-surface-variant text-center" colSpan={7}>
                    Loading cases...
                  </td>
                </tr>
              )}
              {!isLoading && error && (
                <tr>
                  <td className="p-table-cell-padding text-on-surface-variant text-center" colSpan={7}>
                    Backend unavailable. Open with npm run tauri -- dev to load cases.
                  </td>
                </tr>
              )}
              {!isLoading && !error && cases.length === 0 && (
                <tr>
                  <td className="p-table-cell-padding text-on-surface-variant text-center" colSpan={7}>
                    No cases filed yet.
                  </td>
                </tr>
              )}
              {!isLoading && !error && cases.map((caseRecord) => (
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
                  <td className="p-table-cell-padding text-right">
                    <button className="text-secondary hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-surface border-t border-surface-variant px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-on-surface-variant">
            {isLoading ? "Loading entries" : `Showing ${cases.length === 0 ? 0 : 1} to ${cases.length} of ${cases.length} entries`}
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
