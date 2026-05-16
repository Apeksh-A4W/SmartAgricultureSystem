import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/context/AppContext";
import { Mail, Phone, Send, Check, Download, FileText, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  yieldValue: number;
}

export const ReportDialog = ({ open, onOpenChange, yieldValue }: Props) => {
  const { t, crop, soil } = useApp();
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [contact, setContact] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!contact) return;
    setSent(true);
    toast({ title: "✓ " + t("reportSent") });
    setTimeout(() => {
      setSent(false);
      setContact("");
      onOpenChange(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-[92vw] sm:max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-primary p-5 text-primary-foreground relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 relative">
              <FileText className="w-4 h-4" /> {t("sendReport")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs opacity-90 mt-1 relative">
            Yield analytics + recommendations PDF
          </p>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-gradient-to-br from-muted/40 to-card rounded-xl p-3.5 space-y-2 border border-border">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Report preview
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success">
                <TrendingUp className="w-3 h-3" /> +12%
              </span>
            </div>
            <PreviewRow label="Crop" value={crop || "Rice"} />
            <PreviewRow label="Soil" value={soil || "Loamy"} />
            <PreviewRow label="Yield" value={`${yieldValue} t/acre`} />
            <PreviewRow label="Weather" value="Mostly sunny" />
            <PreviewRow label="Market" value="₹2,100 / Q" />
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-semibold text-primary">95%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-primary" style={{ width: "95%" }} />
              </div>
            </div>
          </div>

          <button
            onClick={() => toast({ title: "Report PDF will download shortly" })}
            className="w-full h-11 rounded-lg bg-card border border-border hover:bg-muted transition-smooth active:scale-[0.98] flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMethod("email")}
              className={`h-11 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-smooth active:scale-[0.98] text-sm ${
                method === "email"
                  ? "bg-primary text-primary-foreground shadow-button"
                  : "bg-card border border-border text-foreground"
              }`}
            >
              <Mail className="w-4 h-4" /> Email
            </button>
            <button
              onClick={() => setMethod("phone")}
              className={`h-11 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-smooth active:scale-[0.98] text-sm ${
                method === "phone"
                  ? "bg-primary text-primary-foreground shadow-button"
                  : "bg-card border border-border text-foreground"
              }`}
            >
              <Phone className="w-4 h-4" /> Phone
            </button>
          </div>

          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            type={method === "email" ? "email" : "tel"}
            placeholder={method === "email" ? "you@email.com" : "+91 98765 43210"}
            className="w-full h-12 px-3.5 rounded-lg bg-card border border-border focus:border-primary outline-none text-sm"
          />

          <button
            onClick={handleSend}
            disabled={!contact || sent}
            className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold shadow-button transition-smooth active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {sent ? (
              <>
                <Check className="w-4 h-4" /> Sent
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Send
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PreviewRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold text-foreground">{value}</span>
  </div>
);
