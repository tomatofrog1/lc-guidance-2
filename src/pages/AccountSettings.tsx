import { FormEvent, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

const cleanPin = (value: string) => value.replace(/\D/g, "").slice(0, 6);
const cleanAppPassword = (value: string) => value.replace(/\s/g, "");

export default function AccountSettings() {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [smtpEmail, setSmtpEmail] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 5000);
  };

  const validatePin = (value: string) => /^\d{6}$/.test(value);

  const handleChangePin = async (e: FormEvent) => {
    e.preventDefault();
    if (!validatePin(currentPin) || !validatePin(newPin)) {
      showMessage("error", "PINs must be exactly 6 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      showMessage("error", "The new PINs do not match.");
      return;
    }

    setPinBusy(true);
    try {
      await invoke("change_pin", { currentPin, newPin });
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      showMessage("success", "PIN changed successfully.");
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : String(err));
    } finally {
      setPinBusy(false);
    }
  };

  const handleUpdateEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!smtpEmail.trim() || !smtpPassword.trim() || !recoveryEmail.trim()) {
      showMessage("error", "Fill in the Gmail and recovery email fields.");
      return;
    }

    setEmailBusy(true);
    try {
      const cleanedPassword = cleanAppPassword(smtpPassword);
      await invoke("test_smtp", {
        smtpEmail: smtpEmail.trim(),
        smtpPassword: cleanedPassword,
      });
      await invoke("update_smtp_config", {
        smtpEmail: smtpEmail.trim(),
        smtpPassword: cleanedPassword,
        recoveryEmail: recoveryEmail.trim(),
      });
      setSmtpPassword("");
      showMessage("success", "Recovery email settings updated.");
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : String(err));
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
      {message && (
        <div className={`fixed top-20 right-8 z-50 px-5 py-3 rounded-lg shadow-lg border flex items-center gap-2.5 text-xs font-bold ${
          message.type === "success"
            ? "bg-green-50 text-[#15803d] border-green-200"
            : "bg-red-50 text-[#ba1a1a] border-red-200"
        }`}>
          <span className="material-symbols-outlined text-lg">
            {message.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{message.text}</span>
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
          <p className="text-xs text-secondary mt-1">Update the email account and destination for reset codes.</p>
        </div>
        <form onSubmit={handleUpdateEmail} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Email</label>
            <input type="email" value={smtpEmail} onChange={(e) => setSmtpEmail(e.target.value)} className={inputClass} placeholder="lc.guidanceoffice@gmail.com" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Password</label>
            {renderSecretInput(smtpPassword, setSmtpPassword, showSmtpPassword, () => setShowSmtpPassword((value) => !value), {
              placeholder: "Password",
            })}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Recovery Email</label>
            <input type="email" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} className={inputClass} placeholder="Where reset codes are sent" />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button type="submit" disabled={emailBusy} className="bg-[#0B1E43] text-white font-bold text-xs py-2.5 px-5 rounded-lg disabled:opacity-60">
              {emailBusy ? "Testing & Saving..." : "Test Email & Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
