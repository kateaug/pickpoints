"use client"

import { createClient } from "@/lib/supabase/client";
import { useRouter} from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSessionAction } from "@/app/session/actions";

type FormAction = "create" | "join";

export function CreateOrJoinForm() {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function prepareUser() {
    const supabase = createClient();
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    if (!sessionData.session) {
      const { data, error: signInError } =
        await supabase.auth.signInAnonymously();
      if (signInError) throw signInError;
      if (!data.user) throw new Error("Failed to sign in anonymously");
    }

    return supabase;
  }

  async function handleEntry(action: FormAction) {
    const displayName = name.trim();
    const code = sessionId.trim();

    setError(null);
    setMessage(null);

    if (!displayName) {
      setError("Enter a display name to continue.");
      return;
    }

    if (action === "join" && !code) {
      setError("Enter a session code to join.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = await prepareUser();
      if (action === "create") {
        const result = await createSessionAction(displayName);

        if (!result.ok) {
          setError(result.error);
          return;
        }

        router.push(`/session/${result.sessionId}`);
        return;
      }

      const { data: joinedSessionId, error: joinError } = await supabase.rpc(
        "join_session",
        {
          p_session_id: code,
          p_display_name: displayName,
        },
      );

      if (joinError) throw joinError;
      if (!joinedSessionId) throw new Error("The session operation failed.");

      router.push(`/session/${joinedSessionId}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not prepare your user identity.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
     <section className="w-full max-w-md px-6 py-12">
      <header className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">Pickpoints</p>
        <h1 className="mt-2 text-3xl font-semibold">Start a planning session</h1>
      </header>

      <div className="grid gap-2">
        <Label htmlFor="display-name">Your name</Label>
        <Input
          id="display-name"
          autoComplete="nickname"
          maxLength={40}
          placeholder="e.g. Kat"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="mt-6 grid gap-3">
        <Button
          type="button"
          disabled={isLoading}
          onClick={() => handleEntry("create")}
        >
          {isLoading ? "Preparing..." : "Create a session"}
        </Button>

        <div className="flex items-end gap-2">
          <div className="grid min-w-0 flex-1 gap-2">
            <Label htmlFor="session-code">Join an existing session</Label>
            <Input
              id="session-code"
              autoComplete="off"
              placeholder="Session code"
              value={sessionId}
              onChange={(event) => setSessionId(event.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => handleEntry("join")}
          >
            Join
          </Button>
        </div>
      </div>

      <div className="mt-4 min-h-6 text-sm" aria-live="polite">
        {error && <p className="text-destructive">{error}</p>}
        {message && <p className="text-muted-foreground">{message}</p>}
      </div>
    </section>
  );
}
