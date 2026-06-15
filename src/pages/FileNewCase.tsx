import Layout from "../components/Layout";

export default function FileNewCase() {
  return (
    <Layout title="File New Case">
      <div className="max-w-[1440px] mx-auto bg-surface-container-lowest border border-surface-variant rounded shadow-sm relative z-0 mt-8">
        <form className="p-8">
          <div className="grid grid-cols-4 gap-8">
            <div className="col-span-4 md:col-span-1 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest bg-surface-container-low px-2 py-1 border border-outline-variant rounded-sm">Incident Details</span>
                <div className="h-px bg-outline-variant flex-grow"></div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-body-md text-on-surface mb-1">Date & Time</label>
                  <input className="w-full border border-surface-variant rounded-lg p-2 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-[#002F87] focus:border-transparent transition-shadow bg-surface-bright" type="datetime-local"/>
                </div>
                <div>
                  <label className="block font-body-md text-on-surface mb-1">Location</label>
                  <input className="w-full border border-surface-variant rounded-lg p-2 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-[#002F87] focus:border-transparent transition-shadow bg-surface-bright" placeholder="e.g. North Wing Hallway" type="text"/>
                </div>
                <div>
                  <label className="block font-body-md text-on-surface mb-1">Case Type</label>
                  <select className="w-full border border-surface-variant rounded-lg p-2 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-[#002F87] focus:border-transparent transition-shadow bg-surface-bright appearance-none">
                    <option>Academic Integrity</option>
                    <option>Behavioral</option>
                    <option>Attendance</option>
                    <option>Property Damage</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="col-span-4 md:col-span-1 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest bg-surface-container-low px-2 py-1 border border-outline-variant rounded-sm">Student Involved</span>
                <div className="h-px bg-outline-variant flex-grow"></div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-body-md text-on-surface mb-1">Student ID / Name</label>
                  <div className="relative">
                    <input className="w-full border border-surface-variant rounded-lg p-2 pl-8 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-[#002F87] focus:border-transparent transition-shadow bg-surface-bright" placeholder="Search student..." type="text"/>
                    <span className="material-symbols-outlined absolute left-2 top-2.5 text-secondary text-sm">search</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body-md text-on-surface mb-1">Grade/Year</label>
                    <input className="w-full border border-surface-variant rounded-lg p-2 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-[#002F87] focus:border-transparent transition-shadow bg-surface-container-low" readOnly type="text"/>
                  </div>
                  <div>
                    <label className="block font-body-md text-on-surface mb-1">Section</label>
                    <input className="w-full border border-surface-variant rounded-lg p-2 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-[#002F87] focus:border-transparent transition-shadow bg-surface-container-low" readOnly type="text"/>
                  </div>
                </div>
                <button className="text-primary font-body-md hover:underline flex items-center gap-1 mt-2" type="button">
                  <span className="material-symbols-outlined text-sm">add</span> Add second student
                </button>
              </div>
            </div>

            <div className="col-span-4 md:col-span-1 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest bg-surface-container-low px-2 py-1 border border-outline-variant rounded-sm">Report</span>
                <div className="h-px bg-outline-variant flex-grow"></div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-body-md text-on-surface mb-1">Reported By</label>
                  <input className="w-full border border-surface-variant rounded-lg p-2 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-[#002F87] focus:border-transparent transition-shadow bg-surface-bright" placeholder="Teacher / Staff Name" type="text"/>
                </div>
                <div>
                  <label className="block font-body-md text-on-surface mb-1">Description</label>
                  <textarea className="w-full border border-surface-variant rounded-lg p-2 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-[#002F87] focus:border-transparent transition-shadow bg-surface-bright resize-none" placeholder="Detailed account of the incident..." rows={4}></textarea>
                </div>
                <div>
                  <label className="block font-body-md text-on-surface mb-1">Rule / Policy Reference</label>
                  <input className="w-full border border-surface-variant rounded-lg p-2 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-[#002F87] focus:border-transparent transition-shadow bg-surface-bright" placeholder="e.g. Handbook Section 4.2" type="text"/>
                </div>
              </div>
            </div>

            <div className="col-span-4 md:col-span-1 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest bg-surface-container-low px-2 py-1 border border-outline-variant rounded-sm">Resolution</span>
                <div className="h-px bg-outline-variant flex-grow"></div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-body-md text-on-surface mb-2">Current Status</label>
                  <div className="flex border border-surface-variant rounded-lg overflow-hidden">
                    <button className="flex-1 py-2 font-body-md text-center bg-surface-bright border-r border-surface-variant hover:bg-surface-container-low transition-colors" type="button">Pending</button>
                    <button className="flex-1 py-2 font-body-md text-center bg-[#002F87] text-white border-r border-surface-variant" type="button">Resolved</button>
                    <button className="flex-1 py-2 font-body-md text-center bg-surface-bright hover:bg-surface-container-low transition-colors text-error" type="button">Reprimand</button>
                  </div>
                </div>
                <div>
                  <label className="block font-body-md text-on-surface mb-1">Disciplinary Actions / Notes</label>
                  <textarea className="w-full border border-surface-variant rounded-lg p-2 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-[#002F87] focus:border-transparent transition-shadow bg-surface-bright resize-none" placeholder="Actions taken or recommended..." rows={4}></textarea>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-outline-variant flex justify-end gap-4">
            <button className="px-6 py-2 border border-surface-variant rounded text-on-surface font-body-md hover:bg-surface-container-low transition-colors bg-surface-bright" type="button">
              Cancel
            </button>
            <button className="px-6 py-2 bg-[#002F87] text-white rounded font-body-md hover:bg-primary-fixed-variant transition-colors flex items-center gap-2" type="submit">
              <span className="material-symbols-outlined text-sm">save</span>
              File Case
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
