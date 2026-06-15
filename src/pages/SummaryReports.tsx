import Layout from "../components/Layout";

export default function SummaryReports() {
  return (
    <Layout title="Summary & Reports">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="data-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-label-caps text-secondary uppercase">Total Cases</span>
            <span className="material-symbols-outlined text-primary-container bg-secondary-container p-1.5 rounded-DEFAULT" style={{ fontSize: '20px' }}>folder</span>
          </div>
          <div>
            <h3 className="font-display-title text-display-title text-on-background m-0 leading-none">1,248</h3>
            <p className="text-body-md font-body-md text-secondary mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: '16px' }}>arrow_upward</span>
              <span className="text-emerald-700 font-medium">+12%</span> vs last month
            </p>
          </div>
        </div>
        <div className="data-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-label-caps text-secondary uppercase">Pending Action</span>
            <span className="material-symbols-outlined text-tertiary-container bg-error-container p-1.5 rounded-DEFAULT" style={{ fontSize: '20px' }}>pending_actions</span>
          </div>
          <div>
            <h3 className="font-display-title text-display-title text-on-background m-0 leading-none">42</h3>
            <p className="text-body-md font-body-md text-secondary mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-tertiary-container" style={{ fontSize: '16px' }}>error</span>
              <span className="text-tertiary-container font-medium">Requires attention</span>
            </p>
          </div>
        </div>
        <div className="data-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-label-caps text-secondary uppercase">Resolved</span>
            <span className="material-symbols-outlined text-primary-container bg-secondary-container p-1.5 rounded-DEFAULT" style={{ fontSize: '20px' }}>check_circle</span>
          </div>
          <div>
            <h3 className="font-display-title text-display-title text-on-background m-0 leading-none">1,156</h3>
            <p className="text-body-md font-body-md text-secondary mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: '16px' }}>check</span>
              <span className="text-secondary font-medium">92.6% resolution rate</span>
            </p>
          </div>
        </div>
        <div className="data-card p-6 flex flex-col justify-between bg-primary-fixed border-primary-fixed-dim">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-label-caps text-on-primary-fixed uppercase">Most Common Type</span>
            <span className="material-symbols-outlined text-primary bg-surface p-1.5 rounded-DEFAULT" style={{ fontSize: '20px' }}>warning</span>
          </div>
          <div>
            <h3 className="font-section-header text-section-header text-primary m-0 leading-tight">Academic Probation</h3>
            <p className="text-body-md font-body-md text-on-primary-fixed-variant mt-2 flex items-center gap-1">
              <span className="font-semibold">34%</span> of all cases this term
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="data-card p-6 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-section-header text-section-header text-primary">Filing Volume Trend</h3>
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
              <path d="M0,250 C100,200 150,220 250,150 C350,80 400,100 500,60 C600,20 650,80 750,40 L800,30 L800,275 L0,275 Z" fill="url(#areaGrad)"></path>
              <path d="M0,250 C100,200 150,220 250,150 C350,80 400,100 500,60 C600,20 650,80 750,40 L800,30" fill="none" stroke="#002f87" strokeWidth="3"></path>
              <circle cx="250" cy="150" fill="#ffffff" r="4" stroke="#002f87" strokeWidth="2"></circle>
              <circle cx="500" cy="60" fill="#ffffff" r="4" stroke="#002f87" strokeWidth="2"></circle>
              <circle cx="750" cy="40" fill="#ffffff" r="4" stroke="#002f87" strokeWidth="2"></circle>
            </svg>
            <div className="absolute bottom-0 left-0 w-full flex justify-between text-body-md font-body-md text-secondary px-4 mt-2 -mb-6">
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
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
            <div className="relative w-48 h-48 rounded-full border-[24px] border-surface-container flex items-center justify-center mb-6" style={{ borderTopColor: '#001c59', borderRightColor: '#002f87', borderBottomColor: '#3a59b1', borderLeftColor: '#7f9cf8', transform: 'rotate(-45deg)' }}>
              <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'rotate(45deg)' }}>
                <div className="text-center">
                  <span className="block font-display-title text-display-title text-on-background leading-none">100%</span>
                  <span className="block font-label-caps text-label-caps text-secondary mt-1">TOTAL</span>
                </div>
              </div>
            </div>
            <div className="w-full flex flex-col gap-3">
              <div className="flex items-center justify-between text-body-md font-body-md">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-primary"></div>
                  <span className="text-on-background">Academic Probation</span>
                </div>
                <span className="font-medium text-secondary">34%</span>
              </div>
              <div className="flex items-center justify-between text-body-md font-body-md">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-primary-container"></div>
                  <span className="text-on-background">Attendance</span>
                </div>
                <span className="font-medium text-secondary">28%</span>
              </div>
              <div className="flex items-center justify-between text-body-md font-body-md">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-surface-tint"></div>
                  <span className="text-on-background">Behavioral</span>
                </div>
                <span className="font-medium text-secondary">22%</span>
              </div>
              <div className="flex items-center justify-between text-body-md font-body-md">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-on-primary-container"></div>
                  <span className="text-on-background">Other</span>
                </div>
                <span className="font-medium text-secondary">16%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="data-card overflow-hidden flex flex-col">
        <div className="p-6 border-b border-surface-variant flex justify-between items-center bg-surface-container">
          <h3 className="font-section-header text-section-header text-primary">Recent Activity Log</h3>
          <a className="text-body-md font-body-md font-medium text-primary-container hover:text-primary transition-colors flex items-center gap-1" href="/catalog">
            View Full Catalog <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
          </a>
        </div>
        <div className="w-full">
          <div className="zebra-row flex items-center justify-between px-6 py-4 border-b border-surface-variant last:border-b-0 hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-4 w-1/3">
              <span className="inline-block px-2 py-1 bg-surface border border-outline-variant rounded-DEFAULT font-data-mono text-data-mono text-secondary">LC-2023-4091</span>
              <div>
                <p className="font-body-md text-body-md font-medium text-on-background m-0">Doe, Jane A.</p>
                <p className="font-label-caps text-label-caps text-secondary m-0 mt-0.5">Grade 11 • Sci-Tech</p>
              </div>
            </div>
            <div className="w-1/4">
              <p className="font-body-md text-body-md text-on-surface-variant">Academic Probation Hearing</p>
            </div>
            <div className="w-1/6">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-DEFAULT bg-error-container text-on-error-container border border-[#ffb4a7] font-label-caps text-label-caps">
                <span className="w-1.5 h-1.5 rounded-full bg-error"></span> Pending
              </span>
            </div>
            <div className="w-1/6 text-right">
              <p className="font-body-md text-body-md text-secondary">Today, 10:42 AM</p>
            </div>
          </div>
          <div className="zebra-row flex items-center justify-between px-6 py-4 border-b border-surface-variant last:border-b-0 hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-4 w-1/3">
              <span className="inline-block px-2 py-1 bg-surface border border-outline-variant rounded-DEFAULT font-data-mono text-data-mono text-secondary">LC-2023-4090</span>
              <div>
                <p className="font-body-md text-body-md font-medium text-on-background m-0">Smith, Robert J.</p>
                <p className="font-label-caps text-label-caps text-secondary m-0 mt-0.5">Grade 10 • Gen Ed</p>
              </div>
            </div>
            <div className="w-1/4">
              <p className="font-body-md text-body-md text-on-surface-variant">Attendance Warning Issued</p>
            </div>
            <div className="w-1/6">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-DEFAULT bg-secondary-container text-on-secondary-container border border-secondary-fixed-dim font-label-caps text-label-caps">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Closed
              </span>
            </div>
            <div className="w-1/6 text-right">
              <p className="font-body-md text-body-md text-secondary">Yesterday, 3:15 PM</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
