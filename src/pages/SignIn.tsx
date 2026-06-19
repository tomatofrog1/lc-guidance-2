import { useState, FormEvent } from "react";
import lcLogo from "../assets/lc-logo.png";

interface SignInProps {
  onSignIn: () => void;
}

export default function SignIn({ onSignIn }: SignInProps) {
  const [counselorName, setCounselorName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Simple hardcoded validation for demonstration
    if (!counselorName.trim()) {
      setError("Please enter a counselor name.");
      return;
    }
    if (password === "password123") {
      onSignIn();
    } else {
      setError("Incorrect password. Try again.");
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-background text-on-surface">
      {/* Blurred Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat blur-[6px] scale-105"
        style={{ backgroundImage: `url('/lcbuildingbg.jpg')` }}
      />
      {/* Dark Overlay for better contrast */}
      <div className="absolute inset-0 z-0 bg-black/40 dark:bg-black/60" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[440px] px-4">
        <div className="bg-surface border border-surface-variant rounded-lg shadow-2xl overflow-hidden">
          
          <div className="p-8 pb-6 text-center border-b border-surface-variant/50 relative flex flex-col items-center">
            {/* Subtle Folder Tab Motif using absolute positioning */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-primary rounded-b-md opacity-80" />
            
            {/* School Logo */}
            <img src={lcLogo} alt="Laguna College Logo" className="w-20 h-20 object-contain mb-3 mt-2" />
            
            <h1 className="font-display-title text-primary text-3xl mb-2">
              Laguna College
            </h1>
            <p className="font-label-caps text-label-caps text-secondary tracking-widest text-[10px]">
              GUIDANCE OFFICE — CASE FILING SYSTEM
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 pt-6">
            {error && (
              <div className="mb-6 p-3 rounded-DEFAULT bg-error-container text-on-error-container border border-[#ffb4a7] dark:border-[#93000a] flex items-start gap-2">
                <span className="material-symbols-outlined text-[20px]">error</span>
                <p className="font-body-md text-sm mt-0.5">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="font-label-caps text-label-caps text-secondary block mb-1.5">
                  Counselor Name
                </label>
                <input 
                  type="text" 
                  value={counselorName}
                  onChange={(e) => setCounselorName(e.target.value)}
                  className="rounded-md w-full bg-surface-container border border-outline-variant rounded-DEFAULT px-3 py-2.5 font-body-md text-on-surface caret-primary dark:caret-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="e.g., Jenkins"
                />
              </div>

              <div>
                <label className="font-label-caps text-label-caps text-secondary block mb-1.5">
                  Password
                </label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-md w-full bg-surface-container border border-outline-variant rounded-DEFAULT px-3 py-2.5 font-data-mono tracking-widest text-on-surface caret-primary dark:caret-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="mt-8">
              <button 
                type="submit"
                className="rounded-md w-full bg-primary hover:bg-primary-container hover:text-on-primary-container text-on-primary font-body-md font-medium py-3 rounded-DEFAULT transition-colors"
              >
                Sign In
              </button>
            </div>

            <p className="mt-6 text-center font-body-md text-xs text-secondary">
              Contact the administrator if you've forgotten your password.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
