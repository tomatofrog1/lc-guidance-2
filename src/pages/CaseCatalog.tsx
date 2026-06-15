import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";

export default function CaseCatalog() {
  const navigate = useNavigate();
  return (
    <Layout title="Guidance Office">
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
          <div className="font-data-mono text-display-title text-on-surface mt-2">124</div>
        </div>
        <div className="bg-surface border border-surface-variant rounded-lg p-5 border-t-4 border-t-[#f59e0b] shadow-sm">
          <h3 className="font-body-md text-on-surface-variant text-sm mb-1">Pending Review</h3>
          <div className="font-data-mono text-display-title text-on-surface mt-2">38</div>
        </div>
        <div className="bg-surface border border-surface-variant rounded-lg p-5 border-t-4 border-t-[#22c55e] shadow-sm">
          <h3 className="font-body-md text-on-surface-variant text-sm mb-1">Resolved (30d)</h3>
          <div className="font-data-mono text-display-title text-on-surface mt-2">82</div>
        </div>
        <div className="bg-surface border border-surface-variant rounded-lg p-5 border-t-4 border-t-[#ef4444] shadow-sm">
          <h3 className="font-body-md text-on-surface-variant text-sm mb-1">Active Reprimands</h3>
          <div className="font-data-mono text-display-title text-on-surface mt-2">14</div>
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
              <tr className="border-b border-surface-variant/50 hover:bg-surface-container transition-colors cursor-pointer group" onClick={() => navigate('/case/0042')}>
                <td className="p-table-cell-padding">
                  <span className="case-id px-2 py-0.5 rounded text-data-mono font-data-mono inline-block">#0042</span>
                </td>
                <td className="p-table-cell-padding text-on-surface-variant">Oct 24, 2023</td>
                <td className="p-table-cell-padding font-medium">Eleanor Vance</td>
                <td className="p-table-cell-padding">
                  <span className="bg-surface-container-high px-2 py-1 rounded text-xs text-on-surface-variant border border-outline-variant">Behavioral</span>
                </td>
                <td className="p-table-cell-padding">
                  <span className="badge-pending border px-2 py-1 rounded font-label-caps text-[10px] tracking-wider uppercase inline-block">Pending</span>
                </td>
                <td className="p-table-cell-padding text-on-surface-variant">Mr. Dudley</td>
                <td className="p-table-cell-padding text-right">
                  <button className="text-secondary hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </td>
              </tr>
              <tr className="border-b border-surface-variant/50 hover:bg-surface-container transition-colors cursor-pointer group" onClick={() => navigate('/case/0041')}>
                <td className="p-table-cell-padding">
                  <span className="case-id px-2 py-0.5 rounded text-data-mono font-data-mono inline-block">#0041</span>
                </td>
                <td className="p-table-cell-padding text-on-surface-variant">Oct 22, 2023</td>
                <td className="p-table-cell-padding font-medium">Luke Crain</td>
                <td className="p-table-cell-padding">
                  <span className="bg-surface-container-high px-2 py-1 rounded text-xs text-on-surface-variant border border-outline-variant">Academic</span>
                </td>
                <td className="p-table-cell-padding">
                  <span className="badge-resolved border px-2 py-1 rounded font-label-caps text-[10px] tracking-wider uppercase inline-block">Resolved</span>
                </td>
                <td className="p-table-cell-padding text-on-surface-variant">Ms. Montague</td>
                <td className="p-table-cell-padding text-right">
                  <button className="text-secondary hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </td>
              </tr>
              <tr className="border-b border-surface-variant/50 hover:bg-surface-container transition-colors cursor-pointer group" onClick={() => navigate('/case/0040')}>
                <td className="p-table-cell-padding">
                  <span className="case-id px-2 py-0.5 rounded text-data-mono font-data-mono inline-block">#0040</span>
                </td>
                <td className="p-table-cell-padding text-on-surface-variant">Oct 19, 2023</td>
                <td className="p-table-cell-padding font-medium">Theodora Crain</td>
                <td className="p-table-cell-padding">
                  <span className="bg-surface-container-high px-2 py-1 rounded text-xs text-on-surface-variant border border-outline-variant">Attendance</span>
                </td>
                <td className="p-table-cell-padding">
                  <span className="badge-reprimand border px-2 py-1 rounded font-label-caps text-[10px] tracking-wider uppercase inline-block">Reprimand</span>
                </td>
                <td className="p-table-cell-padding text-on-surface-variant">Principal Sanderson</td>
                <td className="p-table-cell-padding text-right">
                  <button className="text-secondary hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </td>
              </tr>
              <tr className="border-b border-surface-variant/50 hover:bg-surface-container transition-colors cursor-pointer group" onClick={() => navigate('/case/0039')}>
                <td className="p-table-cell-padding">
                  <span className="case-id px-2 py-0.5 rounded text-data-mono font-data-mono inline-block">#0039</span>
                </td>
                <td className="p-table-cell-padding text-on-surface-variant">Oct 15, 2023</td>
                <td className="p-table-cell-padding font-medium">Steven Crain</td>
                <td className="p-table-cell-padding">
                  <span className="bg-surface-container-high px-2 py-1 rounded text-xs text-on-surface-variant border border-outline-variant">Academic</span>
                </td>
                <td className="p-table-cell-padding">
                  <span className="badge-pending border px-2 py-1 rounded font-label-caps text-[10px] tracking-wider uppercase inline-block">Pending</span>
                </td>
                <td className="p-table-cell-padding text-on-surface-variant">System Auto</td>
                <td className="p-table-cell-padding text-right">
                  <button className="text-secondary hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-surface border-t border-surface-variant px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-on-surface-variant">Showing 1 to 4 of 124 entries</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-outline-variant rounded bg-surface hover:bg-surface-container-low text-on-surface-variant disabled:opacity-50 text-sm" disabled>Previous</button>
            <button className="px-3 py-1 border border-primary-container rounded bg-primary-container text-white text-sm">1</button>
            <button className="px-3 py-1 border border-outline-variant rounded bg-surface hover:bg-surface-container-low text-on-surface-variant text-sm">2</button>
            <button className="px-3 py-1 border border-outline-variant rounded bg-surface hover:bg-surface-container-low text-on-surface-variant text-sm">3</button>
            <span className="px-2 py-1 text-on-surface-variant">...</span>
            <button className="px-3 py-1 border border-outline-variant rounded bg-surface hover:bg-surface-container-low text-on-surface-variant text-sm">Next</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
