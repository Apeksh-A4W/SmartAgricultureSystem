import React from "react";
import { AuthDialog } from "@/components/AuthDialog";
import {
  ArrowLeft,
  Globe,
  User,
  Bell,
  LogOut
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useApp } from "@/context/AppContext";

import { Language } from "@/lib/i18n";

import { useAuth } from "@/context/AuthContext";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {

  showBack?: boolean;

  onBack?: () => void;

  transparent?: boolean;

  showAlertsLink?: boolean;
}

const langs: {
  code: Language;
  label: string;
}[] = [

  {
    code: "en",
    label: "English"
  },

  {
    code: "kn",
    label: "ಕನ್ನಡ"
  },

  {
    code: "hi",
    label: "हिंदी"
  },
];

export const TopBar = ({

  showBack = true,

  onBack,

  transparent = false,

  showAlertsLink = true,

}: TopBarProps) => {

  const navigate = useNavigate();

  const {
    lang,
    setLang,
    t
  } = useApp();

  const {
    logout,
    isAuthenticated
  } = useAuth();

  const currentLang =
    langs.find(
      (l) => l.code === lang
    )!;
const [authOpen, setAuthOpen] =
  React.useState(false);

const [authMode, setAuthMode] =
  React.useState<"signin" | "signup">(
    "signin"
  );
 return (

  <header
    className={`sticky top-0 z-40 flex items-center justify-between px-4 py-3 ${
      transparent
        ? "bg-transparent"
        : "bg-card/90 backdrop-blur-md border-b border-border"
    }`}
  >

    <div className="flex items-center gap-2">

      {showBack && (

        <button
          onClick={() =>
            onBack
              ? onBack()
              : navigate(-1)
          }
          className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center"
        >

          <ArrowLeft className="w-5 h-5 text-foreground" />

        </button>
      )}

    </div>

    <div className="flex items-center gap-2">

      {showAlertsLink && (

        <button
          onClick={() =>
            navigate("/alerts")
          }
          className="h-10 w-10 rounded-lg bg-card border border-border flex items-center justify-center relative"
        >

          <Bell className="w-4 h-4 text-foreground" />

          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />

        </button>
      )}

      <DropdownMenu>

        <DropdownMenuTrigger asChild>

          <button
            className="h-10 px-3 rounded-lg bg-card border border-border flex items-center gap-1.5"
          >

            <Globe className="w-4 h-4 text-primary" />

            <span className="text-xs font-semibold uppercase">
              {currentLang.code}
            </span>

          </button>

        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">

          {langs.map((l) => (

            <DropdownMenuItem
              key={l.code}
              onClick={() =>
                setLang(l.code)
              }
            >

              {l.label}

            </DropdownMenuItem>
          ))}

        </DropdownMenuContent>

      </DropdownMenu>

      {isAuthenticated ? (

        <DropdownMenu>

          <DropdownMenuTrigger asChild>

            <button
              className="h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center"
            >

              <User className="w-4 h-4" />

            </button>

          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">

            <DropdownMenuItem
              onClick={() => {

                logout();

                navigate("/");
              }}
            >

              <LogOut className="w-4 h-4 mr-2" />

              Logout

            </DropdownMenuItem>

          </DropdownMenuContent>

        </DropdownMenu>

      ) : (

        <button

          onClick={() => {

            setAuthMode("signin");

            setAuthOpen(true);
          }}

          className="h-10 px-3 rounded-lg bg-primary text-white flex items-center gap-2"
        >

          <User className="w-4 h-4" />

          Login

        </button>
      )}

    </div>

    <AuthDialog
      open={authOpen}
      onOpenChange={setAuthOpen}
      defaultMode={authMode}
    />

  </header>
);
  
};