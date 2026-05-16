import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  Mail,
  Lock,
  Loader2,
  Sprout
} from "lucide-react";
import { useEffect } from "react";


interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultMode?: "signin" | "signup";
}

export const AuthDialog = ({
  open,
  onOpenChange,
  defaultMode = "signin"
}: Props) => {

  const [mode, setMode] =
    useState<"signin" | "signup">(defaultMode);

  const [email, setEmail] = useState("");
  const [username, setUsername] =
  useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
  useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    setMode(defaultMode);
    // Clear form when mode changes
    setEmail("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");

  }, [defaultMode]);

  // Clear form when dialog mode changes
  useEffect(() => {
    if (mode === "signin") {
      setEmail("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
    }
  }, [mode]);

 const { login } = useAuth();

const handleEmail = async (
  e: React.FormEvent
) => {

  e.preventDefault();

  setLoading(true);

  try {

    const endpoint =
      mode === "signup"
        ? "register"
        : "login";
console.log({

  username,

  email,

  password,

  confirm_password:
    confirmPassword

});
    const response =
      await fetch(

        `http://127.0.0.1:8000/api/auth/${endpoint}/`,

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(

            mode === "signup"
              ? {

                  username,

                  email,

                  password,

                  confirm_password:
  confirmPassword,

                  phone_number:
                    ""
                }

              : {

                  username,

                  password
                }
          ),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      alert(
        JSON.stringify(data)
      );

      return;
    }

    if (mode === "signin") {

      login(

        data.tokens.access,

        data.tokens.refresh
      );

      toast({
        title:
          "Login successful"
      });

      onOpenChange(false);
    }

    if (mode === "signup") {

      toast({
        title:
          "Registration successful"
      });

      setMode("signin");
    }

  } catch (err: any) {

    alert(err.message);

  } finally {

    setLoading(false);
  }
};

const handleModeChange = (newMode: "signin" | "signup") => {
  setMode(newMode);
  // Clear form when switching modes
  setEmail("");
  setUsername("");
  setPassword("");
  setConfirmPassword("");
};

 

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-[92vw] sm:max-w-md p-0 overflow-hidden">
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

        <div className="p-5 space-y-4">
          

         

          <form onSubmit={handleEmail} className="space-y-3">
            <div className="relative">

  <input
    type="text"
    required
    value={username}
    onChange={(e) =>
      setUsername(e.target.value)
    }
    placeholder="Username"
    className="w-full h-12 pl-3 pr-3 rounded-xl bg-card border border-border focus:border-primary outline-none text-sm transition-smooth"
  />

</div>
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
            {mode === "signup" && (
            <div className="relative">

  <input
    type="password"
    required
    value={confirmPassword}
    onChange={(e) =>
      setConfirmPassword(e.target.value)
    }
    placeholder="Confirm Password"
    className="w-full h-12 pl-3 pr-3 rounded-xl bg-card border border-border focus:border-primary outline-none text-sm transition-smooth"
  />

</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold shadow-button transition-smooth active:scale-[0.98] hover:opacity-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {mode === "signup" ? "Sign Up" : "Sign In"}
            </button>
          </form>

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
        </div>
      </DialogContent>
    </Dialog>
  );
};
