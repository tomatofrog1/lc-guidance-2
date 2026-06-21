import { useState, useEffect, Fragment, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

interface ProofItem {
  name: string;
  data: string;
}

interface FileNewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Case category data ──────────────────────────────────────────────────────
const CASE_CATEGORIES = [
  {
    id: "academic",
    label: "Academic",
    color: "#185FA5",
    bg: "#E6F1FB",
    border: "#B5D4F4",
    cases: [
      "Poor academic performance",
      "Learning difficulties",
      "Study skills & habits",
      "Absenteeism / tardiness",
      "Course selection",
      "Dropout prevention",
    ],
  },
  {
    id: "personal",
    label: "Personal / Social",
    color: "#0F6E56",
    bg: "#E1F5EE",
    border: "#9FE1CB",
    cases: [
      "Peer relationship issues",
      "Family problems",
      "Self-esteem & identity",
      "Adjustment difficulties",
      "Grief & loss",
      "Gender & sexuality",
      "Substance use",
      "Social media issues",
    ],
  },
  {
    id: "behavioural",
    label: "Behavioural",
    color: "#854F0B",
    bg: "#FAEEDA",
    border: "#FAC775",
    cases: [
      "Defiance / non-compliance",
      "Classroom disruption",
      "Bullying",
      "Truancy / skipping",
      "Vandalism / property damage",
      "Theft & dishonesty",
      "Inappropriate language",
      "Gang-related behaviour",
      "Substance possession",
    ],
  },
  {
    id: "crisis",
    label: "Crisis, Violence & Mental Health",
    color: "#A32D2D",
    bg: "#FCEBEB",
    border: "#F7C1C1",
    cases: [
      "Physical fighting",
      "Assault on staff",
      "Weapons possession",
      "Threats & intimidation",
      "Self-harm & suicide risk",
      "Sexual harassment",
      "Anxiety & depression",
      "Trauma & abuse",
      "Crisis intervention",
    ],
  },
];

const PROGRESS_OPTIONS = [
  {
    value: "Pending",
    label: "Pending",
    desc: "Under review",
    dot: "#854F0B",
    bg: "#FAEEDA",
    border: "#FAC775",
    text: "#633806",
  },
  {
    value: "Reprimand",
    label: "Reprimand",
    desc: "Action issued",
    dot: "#A32D2D",
    bg: "#FCEBEB",
    border: "#F7C1C1",
    text: "#791F1F",
  },
  {
    value: "Resolved",
    label: "Resolved",
    desc: "Case closed",
    dot: "#0F6E56",
    bg: "#E1F5EE",
    border: "#9FE1CB",
    text: "#085041",
  },
];

const GRADE_LEVEL_OPTIONS = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const SECTION_OPTIONS = ["A", "B", "C", "D", "E", "F", "G", "STEM", "ABM", "HUMMS", "GAS"];

// ── Helper ──────────────────────────────────────────────────────────────────
function getCategoryForCase(caseStr: string) {
  for (const cat of CASE_CATEGORIES) {
    if (cat.cases.includes(caseStr)) return cat;
  }
  return null;
}

const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const emptyFormData = () => ({
  firstName: "",
  lastName: "",
  middleInitial: "",
  date: getTodayDateString(),
  case: "",
  caseCategory: "",
  sanction: "",
  progress: "Pending",
  level: "",
  section: "",
  adviser: "",
  uploadedProofs: [] as ProofItem[],
});

// ── Component ───────────────────────────────────────────────────────────────
export default function FileNewCaseModal({ isOpen, onClose }: FileNewCaseModalProps) {
  const [isVisible, setIsVisible] = useState(isOpen);
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>("behavioural");
  const toastTimerRef = useRef<number | null>(null);

  const [formData, setFormData] = useState(emptyFormData);

  const isFormEmpty = () =>
    !formData.firstName.trim() &&
    !formData.lastName.trim() &&
    !formData.middleInitial.trim() &&
    !formData.date &&
    !formData.case.trim() &&
    !formData.sanction.trim() &&
    !formData.level.trim() &&
    !formData.section.trim() &&
    !formData.adviser.trim() &&
    formData.uploadedProofs.length === 0;

  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(false);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    window.requestAnimationFrame(() => setIsToastVisible(true));
    toastTimerRef.current = window.setTimeout(() => {
      setIsToastVisible(false);
      window.setTimeout(() => setToastMessage(""), 180);
    }, 2800);
  };

  const handleCloseAttempt = () => {
    if (!isFormEmpty()) setShowConfirmClose(true);
    else onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = window.setTimeout(() => setIsVisible(false), 220);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setShowConfirmClose(false);
      setIsEditingReview(false);
      setSubmitError("");
      setToastMessage("");
      setIsToastVisible(false);
      const saved = localStorage.getItem("new_case_draft");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData({ ...emptyFormData(), ...parsed });
          const cat = getCategoryForCase(parsed.case);
          if (cat) setExpandedCategory(cat.id);
        } catch {}
      } else {
        setFormData(emptyFormData());
        setExpandedCategory("behavioural");
      }
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleSelectCase = (categoryId: string, caseName: string) => {
    setFormData((p) => ({ ...p, case: caseName, caseCategory: categoryId }));
  };

  const handleUploadProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((p) => ({
        ...p,
        uploadedProofs: [...p.uploadedProofs, { name: file.name, data: reader.result as string }],
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDeleteProof = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setFormData((p) => ({ ...p, uploadedProofs: p.uploadedProofs.filter((_, i) => i !== index) }));
  };

  const handleNext = () => {
    setIsEditingReview(false);
    setSubmitError("");
    if (currentStep === 1 && !formData.case.trim()) {
      showToast("Please fill out the required case type field.");
      return;
    }
    if (currentStep === 2) {
      const requiredFields = [
        formData.date,
        formData.sanction,
        formData.progress,
        formData.lastName,
        formData.firstName,
        formData.level,
        formData.section,
        formData.adviser,
      ];

      if (requiredFields.some((value) => !value.trim())) {
        showToast("Please fill out all required fields before continuing.");
        return;
      }
      if (formData.date > getTodayDateString()) {
        showToast("Date of incident cannot be later than today.");
        return;
      }
    }
    setCurrentStep((s) => Math.min(s + 1, 4));
  };
  const handleBack = () => {
    setIsEditingReview(false);
    setSubmitError("");
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const resetForm = () => {
    setCurrentStep(1);
    setIsEditingReview(false);
    setSubmitError("");
    setExpandedCategory("behavioural");
    setToastMessage("");
    setFormData(emptyFormData());
  };

  const handleFileCase = async () => {
    setSubmitError("");
    if (!formData.case.trim()) {
      showToast("Please fill out the required case type field.");
      setCurrentStep(1);
      return;
    }
    if (
      !formData.date.trim() ||
      !formData.sanction.trim() ||
      !formData.progress.trim() ||
      !formData.lastName.trim() ||
      !formData.firstName.trim() ||
      !formData.level.trim() ||
      !formData.section.trim() ||
      !formData.adviser.trim()
    ) {
      showToast("Please fill out all required fields before filing.");
      setCurrentStep(2);
      return;
    }
    if (formData.date > getTodayDateString()) {
      showToast("Date of incident cannot be later than today.");
      setCurrentStep(2);
      return;
    }
    setIsSubmitting(true);
    try {
      const newCaseId = await invoke<number>("add_case", {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        middleInitial: formData.middleInitial.trim(),
        level: formData.level.trim(),
        section: formData.section.trim(),
        date: formData.date,
        dateFiled: new Date().toISOString(),
        adviser: formData.adviser.trim(),
        case: formData.case.trim(),
        sanction: formData.sanction.trim(),
        progress: formData.progress,
      });

      if (formData.uploadedProofs.length > 0) {
        localStorage.setItem(`case_proofs_${newCaseId}`, JSON.stringify(formData.uploadedProofs));
      }

      localStorage.removeItem("new_case_draft");

      const autoBackup = localStorage.getItem("backup_settings_auto") !== "false";
      const freq = localStorage.getItem("backup_settings_freq") || "Daily";
      if (autoBackup && freq === "On New Record") {
        try { await invoke("create_backup"); } catch {}
      }

      window.dispatchEvent(new Event("cases:changed"));
      onClose();
      resetForm();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !isVisible) return null;

  const STEPS = ["Case type", "Student info", "Attach proofs", "Review"];
  const activeCat = getCategoryForCase(formData.case);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ease-out ${isOpen ? "opacity-100 new-case-modal-backdrop-enter" : "opacity-0 pointer-events-none"}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseAttempt} />

      {/* Panel */}
      <div className={`relative w-full max-w-[960px] bg-surface-container-low rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-all duration-200 ease-out ${isOpen ? "translate-y-0 scale-100 opacity-100 new-case-modal-panel-enter" : "translate-y-4 scale-[0.98] opacity-0"}`}>

        {/* ── Header ── */}
        <div className="px-7 py-4 bg-surface flex items-center justify-between border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0B1E43] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white" style={{ fontSize: 18 }}>folder_open</span>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-secondary">Guidance Office</p>
              <h2 className="text-[19px] font-extrabold text-on-surface leading-tight">File New Case</h2>
            </div>
          </div>
          <button onClick={handleCloseAttempt} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-secondary hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* ── Step Progress Bar ── */}
        <div className="px-7 py-2.5 bg-surface border-b border-outline-variant shrink-0">
          <div className="flex items-center w-full max-w-2xl mx-auto px-4">
            {STEPS.map((label, idx) => {
              const n = idx + 1;
              const isActive = currentStep === n;
              const isDone = currentStep > n;
              return (
                <Fragment key={idx}>
                  <div className={`flex items-center gap-2 shrink-0 py-1.5 px-2.5 rounded-xl transition-all ${isActive ? "bg-[#0B1E43]/6" : ""}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                      isDone ? "bg-[#0B1E43] text-white" : isActive ? "bg-[#0B1E43] text-white" : "bg-surface-container text-secondary border border-outline-variant"
                    }`}>
                      {isDone ? (
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>check</span>
                      ) : (
                        n
                      )}
                    </div>
                    <span className={`text-xs sm:text-[13px] font-bold transition-colors ${isActive ? "text-on-surface" : "text-secondary"}`}>
                      {label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`h-px flex-grow mx-2 sm:mx-4 transition-colors ${isDone ? "bg-[#0B1E43]/40" : "bg-outline-variant"}`} />
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-grow px-7 py-5 bg-surface-container-low">
          <datalist id="grade-level-options">
            {GRADE_LEVEL_OPTIONS.map((option) => <option key={option} value={option} />)}
          </datalist>
          <datalist id="section-options">
            {SECTION_OPTIONS.map((option) => <option key={option} value={option} />)}
          </datalist>

          {/* STEP 1 — Case Type Picker */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-4 max-w-2xl mx-auto animate-fade-in">

              <div className="bg-surface rounded-xl border border-outline-variant p-4">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-secondary uppercase tracking-wider mb-2">
                  Case type
                  <span className="material-symbols-outlined text-error" style={{ fontSize: 10 }}>emergency</span>
                </label>
                <input
                  type="text"
                  placeholder="Select a case type below, or type a custom description."
                  value={formData.case}
                  onChange={(e) => setFormData((p) => ({ ...p, case: e.target.value, caseCategory: "custom" }))}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                />
                {formData.case && activeCat && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{ background: activeCat.bg, color: activeCat.color, border: `1px solid ${activeCat.border}` }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check_circle</span>
                    {activeCat.label}
                  </div>
                )}
              </div>

              {/* Category accordion */}
              <div className="flex flex-col gap-2">
                {CASE_CATEGORIES.map((cat) => {
                  const isOpen = expandedCategory === cat.id;
                  return (
                    <div key={cat.id} className="rounded-xl border border-outline-variant bg-surface overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedCategory(isOpen ? null : cat.id)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-container transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                          <span className="text-sm font-bold text-on-surface">{cat.label}</span>
                          <span className="text-[11px] text-secondary">({cat.cases.length})</span>
                        </div>
                        <span className="material-symbols-outlined text-secondary transition-transform" style={{ fontSize: 18, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                          expand_more
                        </span>
                      </button>
                      <div className={`grid transition-all duration-200 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                        <div className="overflow-hidden">
                          <div className="px-4 pb-3 pt-0 grid grid-cols-2 gap-1.5">
                            {cat.cases.map((c) => {
                              const isSelected = formData.case === c;
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => handleSelectCase(cat.id, c)}
                                  className="text-left text-xs px-3 py-2 rounded-lg border transition-all font-medium hover:-translate-y-0.5"
                                  style={isSelected
                                    ? { background: cat.bg, borderColor: cat.color, color: cat.color }
                                    : { background: "transparent", borderColor: "var(--outline-variant, #cac4d0)", color: "var(--on-surface, #1c1b1f)" }
                                  }
                                >
                                  {c}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* STEP 2 — Incident Details + Student Info */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-4 max-w-2xl mx-auto animate-fade-in">

              {/* Case badge reminder */}
              {formData.case && activeCat && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold"
                  style={{ background: activeCat.bg, color: activeCat.color, border: `1px solid ${activeCat.border}` }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>label</span>
                  {formData.case}
                </div>
              )}

              {/* Incident block */}
              <div className="bg-surface rounded-xl border border-outline-variant p-5">
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-3">Incident details</p>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                      Date of incident
                      <span className="material-symbols-outlined text-error" style={{ fontSize: 10 }}>emergency</span>
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      max={getTodayDateString()}
                      onChange={(e) => {
                        const nextDate = e.target.value;
                        if (nextDate > getTodayDateString()) {
                          showToast("Date of incident cannot be later than today.");
                          setFormData({ ...formData, date: getTodayDateString() });
                          return;
                        }
                        setFormData({ ...formData, date: nextDate });
                      }}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                      Sanction / action taken
                      <span className="material-symbols-outlined text-error" style={{ fontSize: 10 }}>emergency</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe the sanction or action taken…"
                      value={formData.sanction}
                      onChange={(e) => setFormData({ ...formData, sanction: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                      Case status
                      <span className="material-symbols-outlined text-error" style={{ fontSize: 10 }}>emergency</span>
                    </label>
                    <div className="flex gap-2">
                      {PROGRESS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, progress: opt.value })}
                          className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left"
                          style={formData.progress === opt.value
                            ? { background: opt.bg, borderColor: opt.dot, color: opt.text }
                            : { background: "transparent", borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }
                          }
                        >
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: formData.progress === opt.value ? opt.dot : "var(--outline-variant)" }} />
                            <div>
                              <div>{opt.label}</div>
                              <div className="font-normal opacity-70 text-[10px]">{opt.desc}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Student block */}
              <div className="bg-surface rounded-xl border border-outline-variant p-5">
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-3">Student information</p>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                        Last name
                        <span className="material-symbols-outlined text-error" style={{ fontSize: 10 }}>emergency</span>
                      </label>
                      <input
                        type="text" placeholder="e.g. Dela Cruz"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                        First name
                        <span className="material-symbols-outlined text-error" style={{ fontSize: 10 }}>emergency</span>
                      </label>
                      <input
                        type="text" placeholder="e.g. Juan"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Middle initial</label>
                      <input
                        type="text" placeholder="e.g. M"
                        maxLength={3}
                        value={formData.middleInitial}
                        onChange={(e) => setFormData({ ...formData, middleInitial: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                      Grade level
                      <span className="material-symbols-outlined text-error" style={{ fontSize: 10 }}>emergency</span>
                    </label>
                    <input
                      type="text" placeholder="e.g. Grade 10"
                      list="grade-level-options"
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                        Section
                        <span className="material-symbols-outlined text-error" style={{ fontSize: 10 }}>emergency</span>
                      </label>
                      <input
                        type="text" placeholder="e.g. STEM"
                        list="section-options"
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                        Adviser
                        <span className="material-symbols-outlined text-error" style={{ fontSize: 10 }}>emergency</span>
                      </label>
                      <input
                        type="text" placeholder="e.g. Mr. Santos"
                        value={formData.adviser}
                        onChange={(e) => setFormData({ ...formData, adviser: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 px-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Attach Proofs */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-4 max-w-2xl mx-auto animate-fade-in">
              <div className="bg-surface rounded-xl border border-outline-variant p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-0.5">Optional</p>
                    <h3 className="text-base font-bold text-on-surface">Attach documentation</h3>
                    <p className="text-xs text-secondary mt-0.5">Photos, screenshots, or scanned documents.</p>
                  </div>
                  <label className="flex items-center gap-1.5 bg-[#0B1E43] text-white text-xs font-bold py-2 px-4 rounded-lg cursor-pointer hover:bg-[#0F2451] transition-colors shrink-0">
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>upload</span>
                    Add file
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadProof} />
                  </label>
                </div>

                {formData.uploadedProofs.length === 0 ? (
                  <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-outline-variant rounded-xl p-10 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                    <span className="material-symbols-outlined text-secondary group-hover:text-primary transition-colors" style={{ fontSize: 36 }}>add_photo_alternate</span>
                    <div className="text-center">
                      <p className="text-sm font-bold text-on-surface">Drop files here or click to upload</p>
                      <p className="text-xs text-secondary mt-0.5">Supports JPG, PNG, GIF, WEBP</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadProof} />
                  </label>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {formData.uploadedProofs.map((proof, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-xl overflow-hidden border border-outline-variant cursor-pointer aspect-video bg-surface-container"
                        onClick={() => setSelectedProofUrl(proof.data)}
                      >
                        <img src={proof.data} alt={proof.name} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="material-symbols-outlined text-white" style={{ fontSize: 28 }}>zoom_in</span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteProof(e, idx)}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all shadow"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 pt-4 pb-1.5">
                          <p className="text-white text-[10px] font-medium truncate">{proof.name}</p>
                        </div>
                      </div>
                    ))}
                    {/* Add more button */}
                    <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant cursor-pointer hover:border-primary hover:bg-primary/5 transition-all aspect-video group">
                      <span className="material-symbols-outlined text-secondary group-hover:text-primary transition-colors" style={{ fontSize: 24 }}>add</span>
                      <span className="text-xs text-secondary group-hover:text-primary font-medium transition-colors">Add more</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleUploadProof} />
                    </label>
                  </div>
                )}

                {formData.uploadedProofs.length > 0 && (
                  <p className="text-xs text-secondary mt-3">{formData.uploadedProofs.length} file{formData.uploadedProofs.length !== 1 ? "s" : ""} attached</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 4 — Review */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-4 max-w-2xl mx-auto animate-fade-in">

              {/* Edit toggle banner */}
              <div className="flex items-center justify-between bg-surface rounded-xl border border-outline-variant px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-on-surface font-bold">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{isEditingReview ? "edit" : "fact_check"}</span>
                  {isEditingReview ? "Editing fields — click Done when finished" : "Review before filing"}
                </div>
                <button
                  onClick={() => setIsEditingReview((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container transition-colors text-secondary hover:text-on-surface"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    {isEditingReview ? "check" : "edit"}
                  </span>
                  {isEditingReview ? "Done" : "Edit fields"}
                </button>
              </div>

              {/* Case type */}
              <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
                <div className="px-4 py-2.5 border-b border-outline-variant">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Case type</p>
                </div>
                <div className="px-4 py-3 flex items-center gap-3">
                  {activeCat && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: activeCat.bg, color: activeCat.color, border: `1px solid ${activeCat.border}` }}>
                      {activeCat.label}
                    </span>
                  )}
                  {isEditingReview ? (
                    <input
                      type="text" value={formData.case}
                      onChange={(e) => setFormData({ ...formData, case: e.target.value })}
                      className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg py-1.5 px-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm font-bold text-on-surface">{formData.case || <span className="text-secondary italic font-normal">Not set</span>}</span>
                  )}
                </div>
              </div>

              {/* Incident details */}
              <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
                <div className="px-4 py-2.5 border-b border-outline-variant">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Incident details</p>
                </div>
                <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    { label: "Date of Incident", key: "date" },
                    { label: "Status", key: "progress" },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <p className="text-[10px] text-secondary font-bold uppercase tracking-wider mb-1">{label}</p>
                      {isEditingReview && key === "date" ? (
                        <input type="date" value={formData.date}
                          max={getTodayDateString()}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full bg-surface-container border border-outline-variant rounded-lg py-1.5 px-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                      ) : isEditingReview && key === "progress" ? (
                        <select value={formData.progress} onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                          className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-1.5 px-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none">
                          {PROGRESS_OPTIONS.map(o => <option key={o.value}>{o.value}</option>)}
                        </select>
                      ) : (
                        <p className="text-sm text-on-surface font-medium">
                          {key === "date" 
                            ? new Date(formData.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                            : (formData as any)[key] || <span className="text-secondary italic font-normal">Not set</span>}
                        </p>
                      )}
                    </div>
                  ))}
                  <div className="col-span-2">
                    <p className="text-[10px] text-secondary font-bold uppercase tracking-wider mb-1">Sanction</p>
                    {isEditingReview ? (
                      <textarea value={formData.sanction} rows={2}
                        onChange={(e) => setFormData({ ...formData, sanction: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-1.5 px-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                      />
                    ) : (
                      <p className="text-sm text-on-surface font-medium">{formData.sanction || <span className="text-secondary italic font-normal">Not set</span>}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Student info */}
              <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
                <div className="px-4 py-2.5 border-b border-outline-variant">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Student information</p>
                </div>
                <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    { label: "Last name", key: "lastName" },
                    { label: "First name", key: "firstName" },
                    { label: "Middle initial", key: "middleInitial" },
                    { label: "Grade level", key: "level" },
                    { label: "Section", key: "section" },
                    { label: "Adviser", key: "adviser" },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <p className="text-[10px] text-secondary font-bold uppercase tracking-wider mb-1">{label}</p>
                      {isEditingReview ? (
                        <input type="text" value={(formData as any)[key]}
                          list={key === "level" ? "grade-level-options" : key === "section" ? "section-options" : undefined}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                          className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-1.5 px-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                      ) : (
                        <p className="text-sm text-on-surface font-medium">{(formData as any)[key] || <span className="text-secondary italic font-normal">Not set</span>}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Attachments */}
              <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
                <div className="px-4 py-2.5 border-b border-outline-variant flex items-center justify-between">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Attachments</p>
                  <span className="text-[10px] text-secondary">{formData.uploadedProofs.length} file{formData.uploadedProofs.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="px-4 py-3">
                  {formData.uploadedProofs.length === 0 ? (
                    <p className="text-xs text-secondary italic">No files attached.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.uploadedProofs.map((p, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface max-w-[180px]">
                          <span className="material-symbols-outlined text-secondary" style={{ fontSize: 13 }}>image</span>
                          <span className="truncate">{p.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-7 py-3.5 border-t border-outline-variant bg-surface shrink-0 flex items-center justify-between">
          <div>
            {submitError && (
              <p className="text-[11px] font-bold text-error uppercase tracking-widest">{submitError}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button onClick={handleBack} className="px-4 py-2 border border-outline-variant text-on-surface hover:bg-surface-container font-bold text-xs rounded-lg transition-colors">
                Back
              </button>
            )}
            <button onClick={handleCloseAttempt} className="px-4 py-2 border border-outline-variant text-on-surface hover:bg-surface-container font-bold text-xs rounded-lg transition-colors">
              Cancel
            </button>
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2 bg-[#0B1E43] text-white hover:bg-[#0F2451] font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                Continue
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
              </button>
            ) : (
              <button
                onClick={handleFileCase}
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#0B1E43] text-white hover:bg-[#0F2451] disabled:opacity-60 disabled:cursor-not-allowed font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
                {isSubmitting ? "Saving…" : "File case"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Confirm Close Overlay ── */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-[70] flex items-start gap-2 rounded-xl border border-error/30 bg-error-container px-4 py-3 text-on-error-container shadow-xl transition-[transform,opacity] duration-200 ease-out ${isToastVisible ? "translate-x-0 opacity-100 case-toast-x-enter" : "translate-x-4 opacity-0"}`}>
          <span className="material-symbols-outlined text-error" style={{ fontSize: 18 }}>error</span>
          <p className="text-xs font-bold">{toastMessage}</p>
        </div>
      )}

      {showConfirmClose && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6 unsaved-confirm-backdrop-enter">
          <div className="bg-surface border border-outline-variant max-w-sm w-full rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-center unsaved-confirm-panel-enter">
            <span className="material-symbols-outlined text-5xl mx-auto" style={{ color: "#d97706" }}>warning</span>
            <div>
              <h3 className="text-base font-bold text-on-surface">Unsaved changes</h3>
              <p className="text-xs text-secondary mt-1.5 leading-relaxed">
                Save as a draft to continue later, or discard your progress.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  localStorage.setItem("new_case_draft", JSON.stringify(formData));
                  setShowConfirmClose(false);
                  onClose();
                }}
                className="w-full py-2.5 bg-[#0B1E43] text-white font-bold text-xs rounded-xl hover:bg-[#0F2451] transition-all"
              >
                Save draft & close
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("new_case_draft");
                  setShowConfirmClose(false);
                  onClose();
                }}
                className="w-full py-2.5 border border-red-300 text-red-600 font-bold text-xs rounded-xl hover:bg-red-50 transition-all"
              >
                Discard changes
              </button>
              <button
                onClick={() => setShowConfirmClose(false)}
                className="w-full py-2.5 border border-outline-variant text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container transition-all"
              >
                Keep editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setSelectedProofUrl(null)} />
          <div className="relative z-10 max-w-4xl max-h-[88vh] bg-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <button
              onClick={() => setSelectedProofUrl(null)}
              className="absolute top-3 right-3 w-8 h-8 bg-black/60 text-white hover:bg-black rounded-full flex items-center justify-center transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            </button>
            <img src={selectedProofUrl} alt="Full size proof" className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
