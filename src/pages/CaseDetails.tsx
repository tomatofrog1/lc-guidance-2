import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  description: string;
  sanction: string;
  progress: string;
  proofs: string;
}

interface ProofItem {
  name: string;
  data: string;
  created_at: string;
}

const parseProofs = (value: string): ProofItem[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as ProofItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return dateString;
  }
  return parsed.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "—";
  const parsed = new Date(dateStr);

  if (Number.isNaN(parsed.getTime())) {
    return dateStr;
  }

  const hasTime = dateStr.includes("T") || dateStr.includes(":") || dateStr.includes(" ");
  
  if (!hasTime) {
    const formatted = parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return formatted.replace(/^[a-zA-Z]+/, (m) => m.toUpperCase());
  }

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  let formatted = parsed.toLocaleString("en-US", options);
  formatted = formatted.replace(" at ", ", ");
  return formatted.replace(/^[a-zA-Z]+/, (m) => m.toUpperCase());
};

export default function CaseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    middleInitial: "",
    level: "",
    section: "",
    adviser: "",
    date: "",
    date_filed: "",
    case: "",
    description: "",
    sanction: "",
    progress: ""
  });

  // Proofs State
  const [uploadedProofs, setUploadedProofs] = useState<ProofItem[]>([]);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  // Load Case Record
  const loadCase = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await invoke<CaseRecord>("get_case", { id: Number(id) });
      setCaseRecord(data);
      setEditForm({
        firstName: data.first_name,
        lastName: data.last_name,
        middleInitial: data.middle_initial,
        level: data.level,
        section: data.section,
        adviser: data.adviser,
        date: data.date,
        date_filed: data.date_filed,
        case: data.case,
        description: data.description,
        sanction: data.sanction,
        progress: data.progress
      });
      let proofs = parseProofs(data.proofs);
      const stored = localStorage.getItem(`case_proofs_${id}`);
      if (proofs.length === 0 && stored) {
        proofs = (JSON.parse(stored) as { name: string; data: string }[]).map((proof) => ({
          ...proof,
          created_at: new Date().toISOString(),
        }));
        await invoke("update_case", {
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          middleInitial: data.middle_initial,
          level: data.level,
          section: data.section,
          date: data.date,
          dateFiled: data.date_filed,
          adviser: data.adviser,
          case: data.case,
          description: data.description,
          sanction: data.sanction,
          progress: data.progress,
          proofs: JSON.stringify(proofs),
        });
        localStorage.removeItem(`case_proofs_${id}`);
      }
      setUploadedProofs(proofs);
      setCaseRecord((prev) => prev ? { ...prev, proofs: JSON.stringify(proofs) } : prev);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  const saveProofs = useCallback(async (proofs: ProofItem[]) => {
    if (!caseRecord) return;
    await invoke("update_case", {
      id: caseRecord.id,
      firstName: caseRecord.first_name,
      lastName: caseRecord.last_name,
      middleInitial: caseRecord.middle_initial,
      level: caseRecord.level,
      section: caseRecord.section,
      date: caseRecord.date,
      dateFiled: caseRecord.date_filed,
      adviser: caseRecord.adviser,
      case: caseRecord.case,
      description: caseRecord.description,
      sanction: caseRecord.sanction,
      progress: caseRecord.progress,
      proofs: JSON.stringify(proofs),
    });
    setUploadedProofs(proofs);
    setCaseRecord({ ...caseRecord, proofs: JSON.stringify(proofs) });
    window.dispatchEvent(new Event("cases:changed"));
  }, [caseRecord]);

  // Handle Proof Upload
  const handleUploadProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await saveProofs([
          ...uploadedProofs,
          {
          name: file.name,
          data: reader.result as string,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        alert("Failed to upload proof: " + err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Proof Delete
  const handleDeleteProof = async (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    try {
      await saveProofs(uploadedProofs.filter((_, i) => i !== index));
    } catch (err) {
      alert("Failed to delete proof: " + err);
    }
  };



  // Handle Save Edits
  const handleSaveEdits = async () => {
    if (!caseRecord) return;
    try {
      await invoke("update_case", {
        id: caseRecord.id,
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        middleInitial: editForm.middleInitial.trim(),
        level: editForm.level.trim(),
        section: editForm.section.trim(),
        date: editForm.date,
        dateFiled: editForm.date_filed,
        adviser: editForm.adviser.trim(),
        case: editForm.case.trim(),
        description: editForm.description.trim(),
        sanction: editForm.sanction.trim(),
        progress: editForm.progress,
        proofs: caseRecord.proofs
      });
      setIsEditing(false);
      window.dispatchEvent(new Event("cases:changed"));
      loadCase();
    } catch (err) {
      alert("Failed to save case details: " + err);
    }
  };

  const displayedProofs = uploadedProofs;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 mt-6 animate-pulse">
        <div className="h-10 bg-surface-container rounded-lg w-1/3" />
        <div className="h-[400px] bg-surface-container rounded-xl w-full" />
      </div>
    );
  }

  if (error || !caseRecord) {
    return (
      <div className="text-center mt-12 bg-surface border border-outline-variant p-8 rounded-xl max-w-md mx-auto shadow-sm">
        <span className="material-symbols-outlined text-error text-5xl mb-3">error</span>
        <h3 className="text-lg font-bold text-on-surface mb-2">Case Record Not Found</h3>
        <p className="text-sm text-secondary mb-6">{error || "The requested case could not be retrieved."}</p>
        <button
          onClick={() => navigate("/catalog")}
          className="px-6 py-2 bg-[#0F172A] hover:bg-black text-white text-sm font-bold rounded-lg transition-all"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Sub-header / Actions matching the design layout */}
      <div className="flex justify-between items-center mb-4 mt-2">
        <span className="font-data-mono text-xs font-semibold bg-surface border border-outline-variant px-3 py-1.5 rounded-lg text-secondary">
          ID: GC-2026-{caseRecord.id.toString().padStart(4, "0")}
        </span>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdits}
                className="bg-[#15803d] text-white font-bold py-2 px-5 rounded-lg flex items-center gap-1.5 hover:bg-green-700 transition-colors shadow-sm text-xs"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                <span>Save</span>
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditForm({
                    firstName: caseRecord.first_name,
                    lastName: caseRecord.last_name,
                    middleInitial: caseRecord.middle_initial,
                    level: caseRecord.level,
                    section: caseRecord.section,
                    adviser: caseRecord.adviser,
                    date: caseRecord.date,
                    date_filed: caseRecord.date_filed,
                    case: caseRecord.case,
                    description: caseRecord.description,
                    sanction: caseRecord.sanction,
                    progress: caseRecord.progress
                  });
                }}
                className="border border-outline-variant bg-surface text-on-surface font-bold py-2 px-5 rounded-lg flex items-center gap-1.5 hover:bg-surface-container transition-colors text-xs"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="border border-outline-variant bg-surface text-on-surface font-bold py-2 px-5 rounded flex items-center gap-1.5 hover:bg-surface-container transition-colors text-xs"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>Edit</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Guidance Card Document */}
      <div className="bg-[#FAF9F5] dark:bg-surface-container-low border border-outline-variant rounded shadow-[0px_1px_3px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col mb-8">
        {/* Banner with Laguna College Header */}
        <div className="px-8 py-6 border-b border-outline-variant flex justify-between items-center bg-white dark:bg-surface shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border border-outline-variant flex items-center justify-center bg-surface-container-low shrink-0">
              <span className="material-symbols-outlined text-primary text-3xl">school</span>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-[#0B1E43] dark:text-on-surface leading-none tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>Laguna College</h2>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-2">Official Guidance Record</p>
            </div>
          </div>
          <div className="pr-4">
            {isEditing ? (
              <div className="flex flex-col items-end gap-1.5">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mr-2">Progress</label>
                <div className="flex gap-2">
                  {["Resolved", "Pending", "Reprimand"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, progress: status })}
                      className={`px-3 py-1.5 rounded font-bold text-xs border transition-all ${
                        editForm.progress.toLowerCase() === status.toLowerCase()
                          ? status.toLowerCase() === "resolved"
                            ? "border-[#15803d] bg-[#15803d]/10 text-[#15803d]"
                            : status.toLowerCase() === "reprimand"
                            ? "border-[#dc2626] bg-[#dc2626]/10 text-[#dc2626]"
                            : "border-[#d97706] bg-[#d97706]/10 text-[#d97706]"
                          : "border-outline-variant bg-white dark:bg-surface text-secondary hover:bg-surface-container"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className={`border-[3px] font-black text-lg px-6 py-1.5 rounded uppercase tracking-widest transform -rotate-[6deg] inline-block select-none ${
                  caseRecord.progress.toLowerCase() === "resolved"
                    ? "border-[#15803d] text-[#15803d] dark:border-[#34A06A]/70 dark:text-[#34A06A]"
                    : caseRecord.progress.toLowerCase() === "reprimand"
                    ? "border-[#dc2626] text-[#dc2626] dark:border-[#ef4444]/70 dark:text-[#ef4444]"
                    : "border-[#d97706] text-[#d97706] dark:border-[#D9A23B]/70 dark:text-[#D9A23B]"
                }`}
              >
                {caseRecord.progress}
              </div>
            )}
          </div>
        </div>

        {/* Content Body Grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {/* Left Column — Student Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest whitespace-nowrap">Student Information</span>
              <div className="h-[1px] bg-outline-variant/60 flex-grow" />
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-1">Full Name</label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editForm.lastName}
                      placeholder="Last Name"
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="bg-white dark:bg-surface border border-outline-variant rounded-lg py-1.5 px-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary flex-1"
                    />
                    <input
                      type="text"
                      value={editForm.firstName}
                      placeholder="First Name"
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className="bg-white dark:bg-surface border border-outline-variant rounded-lg py-1.5 px-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary flex-1"
                    />
                    <input
                      type="text"
                      value={editForm.middleInitial}
                      placeholder="M.I."
                      maxLength={3}
                      onChange={(e) => setEditForm({ ...editForm, middleInitial: e.target.value })}
                      className="bg-white dark:bg-surface border border-outline-variant rounded-lg py-1.5 px-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary w-16"
                    />
                  </div>
                ) : (
                  <p className="text-[17px] font-semibold text-on-surface">
                    {caseRecord.last_name}, {caseRecord.first_name}{caseRecord.middle_initial ? ` ${caseRecord.middle_initial}.` : ""}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-1">Level</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.level}
                      onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                      className="bg-white dark:bg-surface border border-outline-variant rounded-lg py-1.5 px-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary w-full"
                    />
                  ) : (
                    <p className="text-sm text-on-surface">{caseRecord.level || "—"}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-1">Section</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.section}
                      onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                      className="bg-white dark:bg-surface border border-outline-variant rounded-lg py-1.5 px-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary w-full"
                    />
                  ) : (
                    <p className="text-sm text-on-surface">{caseRecord.section || "—"}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-1">Adviser</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.adviser}
                    onChange={(e) => setEditForm({ ...editForm, adviser: e.target.value })}
                    className="bg-white dark:bg-surface border border-outline-variant rounded-lg py-1.5 px-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary w-full"
                  />
                ) : (
                  <p className="text-sm text-on-surface">{caseRecord.adviser || "—"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column — Case Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest whitespace-nowrap">Case Information</span>
              <div className="h-[1px] bg-outline-variant/60 flex-grow" />
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-1">Date Filed</label>
                <p className="text-sm text-on-surface mb-4">{formatDateTime(caseRecord.date_filed)}</p>
                <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-1">Date of Incident</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="bg-white dark:bg-surface border border-outline-variant rounded-lg py-1.5 px-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary w-full"
                  />
                ) : (
                  <p className="text-sm text-on-surface">{formatDate(caseRecord.date)}</p>
                )}
              </div>

              <div>
                <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-1">Case Type</label>
                {isEditing ? (
                  <textarea
                    value={editForm.case}
                    onChange={(e) => setEditForm({ ...editForm, case: e.target.value })}
                    className="bg-white dark:bg-surface border border-outline-variant rounded-lg py-1.5 px-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary w-full h-24 resize-none"
                  />
                ) : (
                  <p className="text-sm text-on-surface leading-relaxed text-justify">{caseRecord.case}</p>
                )}
              </div>

              <div>
                <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-1">Description</label>
                {isEditing ? (
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="bg-white dark:bg-surface border border-outline-variant rounded-lg py-1.5 px-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary w-full h-24 resize-none"
                  />
                ) : (
                  <p className="text-sm text-on-surface leading-relaxed text-justify whitespace-pre-wrap">
                    {caseRecord.description || "No description provided."}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-1">Sanction / Action Plan</label>
                {isEditing ? (
                  <textarea
                    value={editForm.sanction}
                    onChange={(e) => setEditForm({ ...editForm, sanction: e.target.value })}
                    className="bg-white dark:bg-surface border border-outline-variant rounded-lg py-1.5 px-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary w-full h-24 resize-none"
                  />
                ) : (
                  <div className="border-l-[3px] border-outline-variant/80 pl-4 py-0.5 mt-2">
                    <p className="text-sm italic text-secondary leading-relaxed text-justify">
                      {caseRecord.sanction || "No action plan logged yet."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Signature Area */}
        <div className="flex justify-end px-8 pb-8 mt-4 shrink-0">
          <div className="w-56 border-t border-outline-variant pt-1 text-center">
            <span className="text-[9px] font-bold text-secondary/65 uppercase tracking-widest">Authorized Signature Area</span>
          </div>
        </div>
      </div>

      {/* Attached Proofs Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-section-header text-section-header text-on-surface flex items-center gap-2 font-bold text-lg">
            <span className="material-symbols-outlined text-primary text-xl">attachment</span>
            <span>Documentation & Proofs</span>
          </h3>
          <div>
            <label className="bg-[#0B1E43] dark:bg-primary text-white hover:bg-opacity-95 dark:hover:bg-opacity-80 font-bold text-xs py-2 px-4 rounded transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
              <span className="material-symbols-outlined text-[16px]">upload_file</span>
              <span>Upload Proof</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadProof}
              />
            </label>
          </div>
        </div>

        {displayedProofs.length === 0 ? (
          <div className="text-center bg-surface border border-dashed border-outline-variant p-8 rounded-xl text-secondary text-sm">
            No documentation uploaded for this case yet. Click "Upload Proof" to add images or documents.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {displayedProofs.map((proof, index) => (
              <div
                key={`${proof.name}-${proof.created_at}-${index}`}
                className="group relative bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer aspect-video flex items-center justify-center bg-surface-container"
                onClick={() => setSelectedProofUrl(proof.data)}
              >
                <img
                  src={proof.data}
                  alt={proof.name}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-3xl">visibility</span>
                </div>
                <button
                  onClick={(e) => handleDeleteProof(e, index)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 text-white text-xs truncate font-medium">
                  {proof.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal for Full Image View */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedProofUrl(null)}
          />
          <div className="relative max-w-4xl max-h-[85vh] z-10 overflow-hidden bg-surface rounded-xl shadow-2xl flex flex-col">
            <button
              onClick={() => setSelectedProofUrl(null)}
              className="absolute top-3 right-3 bg-black/60 text-white hover:bg-black rounded-full p-2 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <img
              src={selectedProofUrl}
              alt="Full size proof documentation"
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
