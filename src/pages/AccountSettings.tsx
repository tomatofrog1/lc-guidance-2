import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";

const cleanPin = (value: string) => value.replace(/\D/g, "").slice(0, 6);
type ToastType = "success" | "error";

const maskEmail = (value: string) => {
  const [, domain = "gmail.com"] = value.split("@");
  return `*****@${domain || "gmail.com"}`;
};

export default function AccountSettings() {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [showRecoveryEmail, setShowRecoveryEmail] = useState(false);
  const [isRecoveryEditing, setIsRecoveryEditing] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastTimerRef = useRef<number | null>(null);

  const [pinVerificationAction, setPinVerificationAction] = useState<"export" | "import" | null>(null);
  const [verificationPin, setVerificationPin] = useState("");
  const [showVerificationPin, setShowVerificationPin] = useState(false);
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [isVerificationModalClosing, setIsVerificationModalClosing] = useState(false);

  const handleOpenVerification = (action: "export" | "import") => {
    setPinVerificationAction(action);
    setVerificationPin("");
    setIsVerificationModalClosing(false);
  };

  const handleCloseVerification = () => {
    setIsVerificationModalClosing(true);
    window.setTimeout(() => {
      setPinVerificationAction(null);
      setIsVerificationModalClosing(false);
    }, 200);
  };

  const handleVerifyAndExecute = async (e: FormEvent) => {
    e.preventDefault();
    if (!validatePin(verificationPin)) {
      showToast("error", "PIN must be exactly 6 digits.");
      return;
    }

    setVerificationBusy(true);
    try {
      const isValid = await invoke<boolean>("verify_pin", { pin: verificationPin });
      if (!isValid) {
        showToast("error", "Incorrect PIN.");
        setVerificationBusy(false);
        return;
      }

      handleCloseVerification();

      if (pinVerificationAction === "export") {
        await executeExport();
      } else if (pinVerificationAction === "import") {
        await executeImport();
      }
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : String(err));
    } finally {
      setVerificationBusy(false);
    }
  };

  const executeExport = async () => {
    try {
      const targetPath = await save({
        filters: [{ name: "Database", extensions: ["db"] }],
        defaultPath: "guidance_backup.db"
      });
      if (!targetPath) return;

      await invoke("export_db_file", { destPath: targetPath });
      showToast("success", "Database exported successfully for migration.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : String(err));
    }
  };

  const executeImport = async () => {
    try {
      const selectedPath = await open({
        multiple: false,
        filters: [{ name: "Database", extensions: ["db"] }]
      });
      if (!selectedPath) return;

      const confirmImport = window.confirm("WARNING: Importing this database file will overwrite your current database. This action cannot be undone. Do you want to proceed?");
      if (!confirmImport) return;

      await invoke("import_db_file", { srcPath: selectedPath });
      showToast("success", "Database imported successfully! The app will now reload.");
      window.setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : String(err));
    }
  };

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setIsToastVisible(false);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    window.requestAnimationFrame(() => setIsToastVisible(true));
    toastTimerRef.current = window.setTimeout(() => {
      setIsToastVisible(false);
      window.setTimeout(() => setToast(null), 1000);
    }, 2800);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    invoke<string>("get_recovery_email")
      .then(setRecoveryEmail)
      .catch((err) => showToast("error", err instanceof Error ? err.message : String(err)));
  }, []);

  const validatePin = (value: string) => /^\d{6}$/.test(value);

  const handleChangePin = async (e: FormEvent) => {
    e.preventDefault();
    if (!validatePin(currentPin) || !validatePin(newPin)) {
      showToast("error", "PINs must be exactly 6 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      showToast("error", "The new PINs do not match.");
      return;
    }

    setPinBusy(true);
    try {
      await invoke("change_pin", { currentPin, newPin });
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      showToast("success", "PIN changed successfully.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : String(err));
    } finally {
      setPinBusy(false);
    }
  };

  const handleUpdateRecoveryEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) {
      showToast("error", "Recovery email cannot be empty.");
      return;
    }

    setEmailBusy(true);
    try {
      await invoke("update_recovery_email", {
        recoveryEmail: recoveryEmail.trim(),
      });
      setIsRecoveryEditing(false);
      setShowRecoveryEmail(false);
      showToast("success", "Recovery email settings updated.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : String(err));
    } finally {
      setEmailBusy(false);
    }
  };

  const inputClass = "w-full bg-surface dark:bg-surface-container border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";
  const pinClass = `${inputClass} font-data-mono tracking-[0.35em] text-center`;
  const secretInputClass = `${inputClass} pr-11`;
  const secretPinClass = `${pinClass} pl-11 pr-11`;

  const renderSecretInput = (
    value: string,
    onChange: (value: string) => void,
    isVisible: boolean,
    onToggle: () => void,
    options: {
      className?: string;
      inputMode?: "numeric" | "text";
      placeholder?: string;
      cleanValue?: (value: string) => string;
    } = {}
  ) => (
    <div className="relative">
      <input
        type={isVisible ? "text" : "password"}
        inputMode={options.inputMode}
        value={value}
        onChange={(e) => onChange(options.cleanValue ? options.cleanValue(e.target.value) : e.target.value)}
        className={options.className ?? secretInputClass}
        placeholder={options.placeholder}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={isVisible ? "Hide value" : "Show value"}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-secondary hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">
          {isVisible ? "visibility" : "visibility_off"}
        </span>
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {toast && (
        <div className={`app-toast fixed bottom-5 right-5 z-[70] flex items-start gap-2 rounded-xl px-4 py-3 shadow-xl transition-[transform,opacity] duration-1000 ease-out ${
          toast.type === "success"
            ? "border border-green-500/30 bg-green-50 text-green-900"
            : "border border-error/30 bg-error-container text-on-error-container"
        } ${isToastVisible ? "case-toast-x-enter" : "case-toast-x-exit"}`}>
          <span className={`material-symbols-outlined ${toast.type === "success" ? "text-green-600" : "text-error"}`} style={{ fontSize: 18 }}>
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <p className="text-xs font-bold">{toast.message}</p>
        </div>
      )}

      <div className="bg-surface dark:bg-surface-container border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant bg-surface-container-low dark:bg-surface-container-high/40">
          <h3 className="font-section-header text-[#002F87] dark:text-[#7f9cf8] font-bold text-base uppercase tracking-wider">
            Change PIN
          </h3>
          <p className="text-xs text-secondary mt-1">Use this for normal PIN changes when you still know the current PIN.</p>
        </div>
        <form onSubmit={handleChangePin} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Current PIN</label>
            {renderSecretInput(currentPin, setCurrentPin, showCurrentPin, () => setShowCurrentPin((value) => !value), {
              className: secretPinClass,
              inputMode: "numeric",
              placeholder: "000000",
              cleanValue: cleanPin,
            })}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">New PIN</label>
            {renderSecretInput(newPin, setNewPin, showNewPin, () => setShowNewPin((value) => !value), {
              className: secretPinClass,
              inputMode: "numeric",
              placeholder: "000000",
              cleanValue: cleanPin,
            })}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Confirm New PIN</label>
            {renderSecretInput(confirmPin, setConfirmPin, showConfirmPin, () => setShowConfirmPin((value) => !value), {
              className: secretPinClass,
              inputMode: "numeric",
              placeholder: "000000",
              cleanValue: cleanPin,
            })}
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button type="submit" disabled={pinBusy} className="bg-[#0B1E43] text-white font-bold text-xs py-2.5 px-5 rounded-lg disabled:opacity-60">
              {pinBusy ? "Saving..." : "Save New PIN"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-surface dark:bg-surface-container border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant bg-surface-container-low dark:bg-surface-container-high/40">
          <h3 className="font-section-header text-[#002F87] dark:text-[#7f9cf8] font-bold text-base uppercase tracking-wider">
            Recovery Email
          </h3>
          <p className="text-xs text-secondary mt-1">This is where PIN reset codes are sent.</p>
        </div>
        <form onSubmit={handleUpdateRecoveryEmail} className="p-6 grid grid-cols-1 gap-4">
          <div className="max-w-xl">
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Recovery Email</label>
            <div className="flex gap-2">
              <input
                type={isRecoveryEditing ? "email" : "text"}
                value={isRecoveryEditing || showRecoveryEmail ? recoveryEmail : maskEmail(recoveryEmail)}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                disabled={!isRecoveryEditing}
                className={`${inputClass} disabled:opacity-100 disabled:cursor-default`}
                placeholder="Where reset codes are sent"
              />
              <button
                type="button"
                onClick={() => setShowRecoveryEmail((value) => !value)}
                aria-label={showRecoveryEmail ? "Hide recovery email" : "Show recovery email"}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-outline-variant text-secondary hover:text-primary transition-colors duration-500"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showRecoveryEmail ? "visibility" : "visibility_off"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsRecoveryEditing((value) => !value)}
                aria-label={isRecoveryEditing ? "Lock recovery email" : "Edit recovery email"}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-outline-variant transition-colors duration-500 ${
                  isRecoveryEditing ? "bg-primary text-on-primary" : "text-secondary hover:text-primary"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isRecoveryEditing ? "lock" : "edit"}
                </span>
              </button>
            </div>
          </div>
          {isRecoveryEditing && (
          <div className="flex justify-end">
            <button type="submit" disabled={emailBusy} className="bg-[#0B1E43] text-white font-bold text-xs py-2.5 px-5 rounded-lg disabled:opacity-60">
              {emailBusy ? "Saving..." : "Save Recovery Email"}
            </button>
          </div>
          )}
        </form>
      </div>

      <div className="bg-surface dark:bg-surface-container border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant bg-surface-container-low dark:bg-surface-container-high/40">
          <h3 className="font-section-header text-[#002F87] dark:text-[#7f9cf8] font-bold text-base uppercase tracking-wider">
            Database Migration
          </h3>
          <p className="text-xs text-secondary mt-1">Export or import the full database for migration.</p>
        </div>
        <div className="p-6 flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={() => handleOpenVerification("export")}
            className="flex-1 bg-[#0B1E43] hover:bg-[#122e66] text-white font-bold text-sm py-3 px-5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">upload</span>
            Export Database for Migration
          </button>
          <button
            type="button"
            onClick={() => handleOpenVerification("import")}
            className="flex-1 border border-outline-variant hover:bg-surface-container text-on-surface font-bold text-sm py-3 px-5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Import Database
          </button>
        </div>
      </div>

      {pinVerificationAction !== null && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className={`absolute inset-0 bg-black/45 ${
              isVerificationModalClosing ? "modal-backdrop-exit" : "modal-backdrop-enter"
            }`}
            style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
            onClick={handleCloseVerification}
          />
          <form 
            onSubmit={handleVerifyAndExecute}
            className={`relative bg-surface p-6 rounded-2xl shadow-xl max-w-sm w-full border border-outline-variant ${
              isVerificationModalClosing ? "modal-panel-exit" : "modal-panel-enter"
            }`}
          >
            <div className="flex items-center gap-3 text-primary dark:text-[#7f9cf8] mb-3">
              <span className="material-symbols-outlined text-[28px]">lock</span>
              <h3 className="text-xl font-bold">Verify PIN</h3>
            </div>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              Please enter your 6-digit counselor PIN to authorize this database action.
            </p>
            <div className="mb-6">
              {renderSecretInput(verificationPin, setVerificationPin, showVerificationPin, () => setShowVerificationPin((value) => !value), {
                className: secretPinClass,
                inputMode: "numeric",
                placeholder: "000000",
                cleanValue: cleanPin,
              })}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCloseVerification}
                className="px-4 py-2 rounded-lg font-bold text-sm bg-surface-container hover:bg-surface-container-high transition-colors duration-500 text-on-surface border border-outline-variant"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={verificationBusy}
                className="px-4 py-2 rounded-lg font-bold text-sm bg-primary hover:bg-[#122e66] transition-colors duration-500 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-60"
              >
                {verificationBusy ? "Verifying..." : "Verify & Proceed"}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}
