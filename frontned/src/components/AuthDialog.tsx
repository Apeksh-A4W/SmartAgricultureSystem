import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, User, Loader2, Sprout } from "lucide-react";

// ── Google "G" SVG icon (no external dependency) ─────────
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// ── Divider ───────────────────────────────────────────────
const OrDivider = () => (
  <div className="flex items-center gap-3 my-1">
    <div className="flex-1 h-px bg-border" />
    <span className="text-xs text-muted-foreground">or</span>
    <div className="flex-1 h-px bg-border" />
  </div>
);

// ── Props ─────────────────────────────────────────────────
interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultMode?: "signin" | "signup";
}

// ── Component ─────────────────────────────────────────────
export const AuthDialog = ({
  open,
  onOpenChange,
  defaultMode = "signin"
}: Props) => {

  const { login, googleLogin } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const [email, setEmail]               = useState("");
  const [username, setUsername]         = useState("");
  const [password, setPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Sync mode when parent changes defaultMode
  useEffect(() => {
    setMode(defaultMode);
    clearForm();
  }, [defaultMode]);

  // Clear form when toggling between signin / signup
  useEffect(() => {
    clearForm();
  }, [mode]);

  const clearForm = () => {
    setEmail("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleModeChange = (newMode: "signin" | "signup") => {
    setMode(newMode);
  };

  // ── Email / Password submit ───────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = mode === "signup" ? "register" : "login";

      const body =
        mode === "signup"
          ? { username, email, password, confirm_password: confirmPassword, phone_number: "" }
          : { username, password };

      const response = await fetch(
        `http://127.0.0.1:8000/api/auth/${endpoint}/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMsg =
          typeof data === "object"
            ? Object.values(data).flat().join(" ")
            : data.error || data.message || "Something went wrong";
        toast({ title: "Error", description: errorMsg, variant: "destructive" });
        return;
      }

      if (mode === "signin") {
        login(data.tokens.access, data.tokens.refresh, data.user);
        toast({ title: "Welcome back!", description: `Signed in as ${data.user?.username}` });
        onOpenChange(false);
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        setMode("signin");
      }

    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Google login ──────────────────────────────────────
  const handleGoogleLogin = async () => {
    // Check Google client ID is available
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    
    if (!clientId) {
      toast({
        title: "Google login not configured",
        description: "VITE_GOOGLE_CLIENT_ID is missing from .env",
        variant: "destructive",
      });
      return;
    }

    setGoogleLoading(true);

    try {
      // Load Google Identity Services script if not already loaded
      await loadGoogleScript();

      // Open the Google One Tap / popup picker
      const credential = await getGoogleCredential(clientId);

      await googleLogin(credential);

      toast({
        title: "Welcome!",
        description: "Signed in with Google successfully.",
      });
      onOpenChange(false);

    } catch (err: any) {
      toast({
        title: "Google sign-in failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-[92vw] sm:max-w-md p-0 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-primary p-5 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sprout className="w-5 h-5" />
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm opacity-90 mt-1">
            {mode === "signup"
              ? "Join thousands of farmers using Smart Farming"
              : "Sign in to continue your farming journey"}
          </p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">

          {/* ── Google Button ── */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full h-12 rounded-xl border border-border bg-card hover:bg-accent flex items-center justify-center gap-3 text-sm font-semibold transition-smooth active:scale-[0.98] disabled:opacity-50 shadow-sm"
          >
            {googleLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <GoogleIcon />
            }
            {mode === "signup"
              ? "Continue with Google"
              : "Continue with Google"}
          </button>

          <OrDivider />

          {/* ── Email / Password Form ── */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">

            {/* Username */}
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full h-12 pl-10 pr-3 rounded-xl bg-card border border-border focus:border-primary outline-none text-sm transition-smooth"
              />
            </div>

            {/* Email — signup only */}
            {mode === "signup" && (
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full h-12 pl-10 pr-3 rounded-xl bg-card border border-border focus:border-primary outline-none text-sm transition-smooth"
                />
              </div>
            )}

            {/* Password */}
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-12 pl-10 pr-3 rounded-xl bg-card border border-border focus:border-primary outline-none text-sm transition-smooth"
              />
            </div>

            {/* Confirm Password — signup only */}
            {mode === "signup" && (
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full h-12 pl-10 pr-3 rounded-xl bg-card border border-border focus:border-primary outline-none text-sm transition-smooth"
                />
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold shadow-button transition-smooth active:scale-[0.98] hover:opacity-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "signup" ? "Create Account" : "Sign In"}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "New to Smart Farming?"}{" "}
            <button
              type="button"
              onClick={() => handleModeChange(mode === "signup" ? "signin" : "signup")}
              className="text-primary font-semibold hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
          {/* Hidden Google button fallback container */}
<div
  id="google-btn-fallback"
  style={{
    position: "absolute",
    opacity: 0,
    pointerEvents: "none",
  }}
/>

        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Helpers (outside component to avoid re-creation) ──────

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById("google-gsi-script")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id  = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;  
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in script"));
    document.head.appendChild(script);
  });
}

function getGoogleCredential(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Google sign-in timed out. Please try again."));
    }, 60_000);

    (window as any).google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential: string; error?: string }) => {
        clearTimeout(timeout);
        if (response.credential) {
          resolve(response.credential);
        } else {
          reject(new Error(response.error || "Google sign-in was cancelled"));
        }
      },
      ux_mode: "popup",
    });

    // Skip One Tap entirely — render button directly into a hidden div
    // then programmatically click it to open the popup
    const container = document.getElementById("google-btn-fallback");
    if (!container) {
      clearTimeout(timeout);
      reject(new Error("Google button container not found in DOM"));
      return;
    }

    (window as any).google.accounts.id.renderButton(container, {
      theme: "outline",
      size: "large",
      type: "standard",
    });

    // Auto-click the rendered button to open the popup immediately
    setTimeout(() => {
      const btn = container.querySelector("div[role=button]") as HTMLElement;
      if (btn) btn.click();
    }, 300);
  });
}