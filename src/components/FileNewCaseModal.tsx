import { useState } from "react";

interface FileNewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FileNewCaseModal({ isOpen, onClose }: FileNewCaseModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditingReview, setIsEditingReview] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    date: "",
    case: "",
    sanction: "",
    progress: "Pending",
    level: "",
    section: "",
    adviser: ""
  });

  if (!isOpen) return null;

  const steps = ["Case Details", "Student Information", "Review"];

  const handleNext = () => {
    setIsEditingReview(false);
    setCurrentStep(Math.min(currentStep + 1, 3));
  };
  const handleBack = () => {
    setIsEditingReview(false);
    setCurrentStep(Math.max(currentStep - 1, 1));
  };
  const handleFileCase = () => {
    // Submit logic here
    onClose();
    setCurrentStep(1); // Reset
    setIsEditingReview(false);
    setFormData({
      firstName: "",
      lastName: "",
      date: "",
      case: "",
      sanction: "",
      progress: "Pending",
      level: "",
      section: "",
      adviser: ""
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Panel */}
      <div className="relative w-full max-w-[1000px] bg-surface-container-low rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-6 bg-surface flex justify-between items-start border-b border-outline-variant shrink-0">
          <div>
            <span className="text-primary font-bold text-xs tracking-widest uppercase">New Case Workflow</span>
            <h2 className="text-[28px] font-extrabold text-on-surface mt-1 leading-none">File New Case</h2>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-on-surface transition-colors p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Steps */}
        <div className="px-8 py-6 bg-surface border-b border-outline-variant shrink-0 flex gap-4">
          {steps.map((label, idx) => {
            const stepNumber = idx + 1;
            const isActive = currentStep === stepNumber;
            const isCompleted = currentStep > stepNumber;
            
            return (
              <div 
                key={idx} 
                className={`flex-1 p-4 rounded-xl border transition-all ${
                  isActive 
                    ? "border-primary bg-primary/5" 
                    : "border-outline-variant bg-surface opacity-70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isActive ? "border-primary" : isCompleted ? "border-primary bg-primary" : "border-outline-variant"
                  }`}>
                    {isActive && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                    {isCompleted && <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>check</span>}
                  </div>
                  <div>
                    <div className={`text-[10px] font-bold tracking-widest uppercase ${
                      isActive ? "text-primary" : "text-secondary"
                    }`}>
                      STEP {stepNumber}
                    </div>
                    <div className={`text-sm font-bold mt-0.5 whitespace-nowrap ${
                      isActive ? "text-on-surface" : "text-secondary"
                    }`}>
                      {label}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-8 overflow-y-auto flex-grow bg-surface-container-low">
          {/* STEP 1 — Case Details */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 gap-6 animate-fade-in items-start max-w-2xl mx-auto">
              <div className="bg-surface rounded-2xl border border-outline-variant p-6 shadow-sm">
                <div className="text-primary text-[10px] font-bold tracking-widest uppercase mb-1">Manual</div>
                <h3 className="text-xl font-bold text-on-surface mb-6">Case Details</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Case (case type/description)</label>
                    <input 
                      type="text" placeholder="e.g. Truancy"
                      value={formData.case} onChange={(e) => setFormData({...formData, case: e.target.value})}
                      className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Date</label>
                    <input 
                      type="date" 
                      value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Sanction</label>
                    <textarea 
                      rows={3} placeholder="e.g. Warning issued"
                      value={formData.sanction} onChange={(e) => setFormData({...formData, sanction: e.target.value})}
                      className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-3">Progress</label>
                    <div className="flex gap-3">
                      {["Pending", "Ongoing", "Resolved"].map((status) => (
                        <button 
                          key={status} type="button"
                          onClick={() => setFormData({...formData, progress: status})}
                          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2 ${
                            formData.progress === status 
                              ? "border-primary bg-primary/10 text-primary" 
                              : "border-outline-variant bg-surface text-secondary hover:bg-surface-container"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            formData.progress === status ? "border-primary" : "border-outline-variant"
                          }`}>
                            {formData.progress === status && <div className="w-2 h-2 bg-primary rounded-full" />}
                          </div>
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Student Information */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 gap-6 animate-fade-in items-start max-w-2xl mx-auto">
              <div className="bg-surface rounded-2xl border border-outline-variant p-6 shadow-sm">
                <div className="text-primary text-[10px] font-bold tracking-widest uppercase mb-1">Manual</div>
                <h3 className="text-xl font-bold text-on-surface mb-6">Student Information</h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">First Name</label>
                      <input 
                        type="text" placeholder="e.g. John"
                        value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Last Name</label>
                      <input 
                        type="text" placeholder="e.g. Doe"
                        value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Level</label>
                    <input 
                      type="text" placeholder="e.g. Grade 10"
                      value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})}
                      className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Section</label>
                      <input 
                        type="text" placeholder="e.g. Rizal"
                        value={formData.section} onChange={(e) => setFormData({...formData, section: e.target.value})}
                        className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Adviser</label>
                      <input 
                        type="text" placeholder="e.g. Mr. Smith"
                        value={formData.adviser} onChange={(e) => setFormData({...formData, adviser: e.target.value})}
                        className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 - REVIEW */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 gap-6 animate-fade-in items-start max-w-4xl mx-auto">
              <div className="bg-surface rounded-2xl border border-outline-variant p-6 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-primary text-[10px] font-bold tracking-widest uppercase mb-1">Summary</div>
                    <h3 className="text-xl font-bold text-on-surface">Review & Edit</h3>
                  </div>
                  <button 
                    onClick={() => setIsEditingReview(!isEditingReview)} 
                    className="text-secondary hover:text-primary text-sm font-bold flex items-center gap-1 bg-surface-container hover:bg-surface-container-low px-4 py-2 rounded-lg transition-colors border border-outline-variant"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isEditingReview ? "check" : "edit"}
                    </span> 
                    {isEditingReview ? "Done Editing" : "Edit All Fields"}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">First Name</label>
                    <input 
                      type="text" value={formData.firstName} disabled={!isEditingReview}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full bg-surface disabled:bg-surface-container disabled:text-secondary border border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Last Name</label>
                    <input 
                      type="text" value={formData.lastName} disabled={!isEditingReview}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full bg-surface disabled:bg-surface-container disabled:text-secondary border border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Level</label>
                    <input 
                      type="text" value={formData.level} disabled={!isEditingReview}
                      onChange={(e) => setFormData({...formData, level: e.target.value})}
                      className="w-full bg-surface disabled:bg-surface-container disabled:text-secondary border border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Section</label>
                    <input 
                      type="text" value={formData.section} disabled={!isEditingReview}
                      onChange={(e) => setFormData({...formData, section: e.target.value})}
                      className="w-full bg-surface disabled:bg-surface-container disabled:text-secondary border border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Date</label>
                    <input 
                      type="date" value={formData.date} disabled={!isEditingReview}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-surface disabled:bg-surface-container disabled:text-secondary border border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Adviser</label>
                    <input 
                      type="text" value={formData.adviser} disabled={!isEditingReview}
                      onChange={(e) => setFormData({...formData, adviser: e.target.value})}
                      className="w-full bg-surface disabled:bg-surface-container disabled:text-secondary border border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Case</label>
                    <input 
                      type="text" value={formData.case} disabled={!isEditingReview}
                      onChange={(e) => setFormData({...formData, case: e.target.value})}
                      className="w-full bg-surface disabled:bg-surface-container disabled:text-secondary border border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Sanction</label>
                    <input 
                      type="text" value={formData.sanction} disabled={!isEditingReview}
                      onChange={(e) => setFormData({...formData, sanction: e.target.value})}
                      className="w-full bg-surface disabled:bg-surface-container disabled:text-secondary border border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Progress</label>
                    {isEditingReview ? (
                      <select 
                        value={formData.progress} onChange={(e) => setFormData({...formData, progress: e.target.value})}
                        className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                      >
                        <option>Pending</option>
                        <option>Ongoing</option>
                        <option>Resolved</option>
                      </select>
                    ) : (
                      <input 
                        type="text" value={formData.progress} disabled={true}
                        className="w-full bg-surface-container text-secondary border border-outline-variant rounded-xl p-3 text-sm transition-colors"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-8 py-5 border-t border-outline-variant bg-surface shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 border border-outline-variant rounded-xl font-bold text-sm text-on-surface hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[20px]">save</span> Save Draft
            </button>
            <span className="text-xs font-bold text-secondary/70 uppercase tracking-widest hidden md:inline-block">No Draft Not saved yet</span>
          </div>
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button 
                onClick={handleBack}
                className="px-6 py-2.5 border border-outline-variant text-on-surface hover:bg-surface-container font-bold text-sm rounded-xl transition-colors"
              >
                Back
              </button>
            )}
            <button 
              onClick={onClose}
              className="px-6 py-2.5 border border-outline-variant text-on-surface hover:bg-surface-container font-bold text-sm rounded-xl transition-colors"
            >
              Cancel
            </button>
            {currentStep < 3 ? (
              <button 
                onClick={handleNext}
                className="px-6 py-2.5 bg-[#0F172A] text-white hover:bg-black font-bold text-sm rounded-xl transition-colors flex items-center gap-2"
              >
                Next <span className="material-symbols-outlined text-[16px]">arrow_forward_ios</span>
              </button>
            ) : (
              <button 
                onClick={handleFileCase}
                className="px-6 py-2.5 bg-[#0F172A] text-white hover:bg-black font-bold text-sm rounded-xl transition-colors flex items-center gap-2"
              >
                File Case <span className="material-symbols-outlined text-[16px]">check</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
