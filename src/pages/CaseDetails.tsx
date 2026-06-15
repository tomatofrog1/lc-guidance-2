export default function CaseDetails() {
  return (
    <>
      <div className="flex justify-between items-end mb-4 mt-8">
        <div className="flex items-center space-x-3">
          <span className="font-data-mono text-data-mono bg-surface-container-low border border-surface-variant px-2 py-1 rounded text-secondary">ID: GC-2023-0891</span>
        </div>
        <div className="flex space-x-3">
          <button className="border border-surface-variant text-on-surface font-body-md py-2 px-4 rounded flex items-center space-x-2 hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-sm">edit</span>
            <span>Edit</span>
          </button>
          <button className="bg-primary-container text-on-primary font-body-md py-2 px-4 rounded flex items-center space-x-2 hover:bg-primary transition-colors">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>Mark as Resolved</span>
          </button>
        </div>
      </div>

      <div className="bg-background border border-surface-variant shadow-[0px_1px_2px_rgba(0,0,0,0.1)] rounded-lg relative overflow-hidden">
        <div className="px-8 py-6 border-b border-surface-variant flex justify-between items-start bg-surface bg-opacity-50">
          <div>
            <h2 className="font-display-title text-display-title text-primary text-2xl">Laguna College</h2>
            <p className="font-label-caps text-label-caps text-secondary mt-1">OFFICIAL GUIDANCE RECORD</p>
          </div>
          <div className="bg-error-container border border-error text-on-error-container font-label-caps px-3 py-1 rounded-[4px] transform -rotate-2 flex items-center space-x-1">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <span>HIGH PRIORITY</span>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <section>
              <h3 className="font-section-header text-section-header text-primary mb-4 border-b border-surface-variant pb-2">Student Profile</h3>
              <div className="space-y-4">
                <div>
                  <label className="font-label-caps text-label-caps text-secondary block mb-1">Full Name</label>
                  <p className="font-body-lg text-body-lg text-on-surface">Eleanor Vance</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-label-caps text-label-caps text-secondary block mb-1">Student ID</label>
                    <p className="font-data-mono text-data-mono text-on-surface bg-surface inline-block px-2 py-1 border border-surface-variant rounded">LC-10492</p>
                  </div>
                  <div>
                    <label className="font-label-caps text-label-caps text-secondary block mb-1">Grade Level</label>
                    <p className="font-body-lg text-body-lg text-on-surface">Junior (11th)</p>
                  </div>
                </div>
                <div>
                  <label className="font-label-caps text-label-caps text-secondary block mb-1">Advisory Group</label>
                  <p className="font-body-md text-body-md text-on-surface">Homeroom 3B - Mr. Dudley</p>
                </div>
              </div>
            </section>
            
            <section>
              <h3 className="font-section-header text-section-header text-primary mb-4 border-b border-surface-variant pb-2">Contact Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="font-label-caps text-label-caps text-secondary block mb-1">Guardian Contact</label>
                  <p className="font-body-md text-body-md text-on-surface">Sarah Vance (Mother) - 555-0198</p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section>
              <h3 className="font-section-header text-section-header text-primary mb-4 border-b border-surface-variant pb-2">Case Context</h3>
              <div className="space-y-4">
                <div>
                  <label className="font-label-caps text-label-caps text-secondary block mb-1">Filing Date</label>
                  <p className="font-body-md text-body-md text-on-surface">October 24, 2023</p>
                </div>
                <div>
                  <label className="font-label-caps text-label-caps text-secondary block mb-1">Primary Category</label>
                  <div className="inline-flex items-center space-x-2 bg-secondary-container text-on-secondary-container px-2 py-1 rounded-[4px] border border-secondary-fixed">
                    <span className="material-symbols-outlined text-sm">psychology</span>
                    <span className="font-body-md text-sm">Academic Stress</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-section-header text-section-header text-primary mb-4 border-b border-surface-variant pb-2">Counselor Notes</h3>
              <div className="bg-surface p-4 border border-surface-variant rounded-lg space-y-4">
                <div>
                  <p className="font-data-mono text-data-mono text-secondary mb-2">Logged: Oct 24, 10:15 AM by Counselor Jenkins</p>
                  <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                    Student reported feeling overwhelmed by recent AP Calculus assignments. Exhibited signs of mild anxiety during session. Recommended a temporary adjustment to homework load and scheduled a follow-up meeting with the math department head to discuss a support plan.
                  </p>
                </div>
                <div className="border-t border-surface-variant pt-4">
                  <p className="font-data-mono text-data-mono text-secondary mb-2">Logged: Oct 26, 02:30 PM by Counselor Jenkins</p>
                  <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                    Spoke with Mrs. Vance. She noted Eleanor has been staying up past midnight studying. Agreed to enforce stricter sleep hygiene protocols at home.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="h-2 bg-primary w-full opacity-10"></div>
      </div>
    </>
  );
}
