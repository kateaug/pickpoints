"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Check, Copy } from "lucide-react";

export function SessionIdCopyButton({sessionId}: {sessionId: string}) {
  const [copied, setIsCopied] = useState<boolean>(false);

  async function copySessionId () {
    await navigator.clipboard.writeText(sessionId);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1600)
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      title="Copy session code"
      aria-label="Copy session code"
      onClick={copySessionId}
    >
      {copied ? <Check /> : <Copy />}
    </Button>
  )};