"use server";

import { createClient } from "@/lib/supabase/server";

type CreateSessionActionResponse =
    | { ok: true; sessionId: string }
    | { ok: false; error: string };

export async function createSessionAction(
    name: string,
): Promise<CreateSessionActionResponse> {
    if (typeof name !== "string") {
        return { ok: false, error: "Enter a valid name." };
    }

    const normalisedName = name.trim();
    if (normalisedName.length < 1 || normalisedName.length > 40) {
        return { ok: false, error: "Name must be between 1 and 40 characters." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
        return {
            ok: false,
            error: "Your guest session could not be verified. Please try again.",
        };
    }

    const { data: sessionId, error: createError } = await supabase.rpc(
        "create_session",
        { p_display_name: normalisedName },
    );

    if (createError || !sessionId) {
        return { ok: false, error: "Could not create session. Please try again." };
    }

    return { ok: true, sessionId };
}