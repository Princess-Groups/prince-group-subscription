import { PhoneOff } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLogCall } from "@/hooks/useNetwork";

type CallState = "calling" | "connecting" | "unavailable" | "ended" | "missed";

const LABEL: Record<CallState, string> = {
  calling: "Calling…",
  connecting: "Connecting…",
  unavailable: "Voice calling is not connected yet",
  ended: "Call ended",
  missed: "Missed call",
};

/**
 * Secure in-site calling shell. Real-time audio requires a WebRTC/voice
 * provider to be connected — until then the panel reports the honest state
 * and every attempt is logged for the member call history.
 */
export function CallPanel({
  open,
  onOpenChange,
  calleeId,
  calleeName,
  conversationId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  calleeId: string;
  calleeName: string;
  conversationId?: string | null;
}) {
  const [state, setState] = useState<CallState>("calling");
  const logCall = useLogCall();

  useEffect(() => {
    if (!open) return;
    setState("calling");
    void logCall.mutateAsync({ calleeId, conversationId: conversationId ?? null, status: "calling" }).catch(() => undefined);
    const t1 = setTimeout(() => setState("connecting"), 1200);
    const t2 = setTimeout(() => setState("unavailable"), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, calleeId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Call {calleeName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="relative grid size-20 place-items-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {calleeName.slice(0, 2).toUpperCase()}
            {state === "calling" || state === "connecting" ? (
              <span className="absolute inset-0 animate-ping rounded-full border-2 border-secondary/50 motion-reduce:animate-none" />
            ) : null}
          </span>
          <p className="text-sm font-semibold text-primary">{LABEL[state]}</p>
          {state === "unavailable" ? (
            <p className="text-xs text-muted-foreground">
              Private numbers stay hidden. Browser voice calling activates as soon as the calling service is
              connected — meanwhile, send a message and the member will be notified.
            </p>
          ) : null}
          <Button
            variant="destructive"
            onClick={() => {
              setState("ended");
              onOpenChange(false);
            }}
          >
            <PhoneOff className="size-4" /> End Call
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
