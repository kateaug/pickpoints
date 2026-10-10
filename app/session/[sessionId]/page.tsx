import { SessionRoom } from "@/components/session/session-room";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";


export default async function SessionPage({params}: {params: Promise<{sessionId: string}>}) {
    const {sessionId} = await params;

    if (!/^[0-9a-f-]{36}$/i.test(sessionId)) notFound();

    const supabase = await createClient();

     const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .maybeSingle();

    if (sessionError) throw new Error("Could not load this session.");
    if (!session) notFound();

    const { data: sessionMembers, error: membersError } = await supabase
    .from("session_members")
    .select(
      "userId:user_id, displayName:display_name, isAdmin:is_admin, joinedAt:joined_at",
    )
    .eq("session_id", sessionId)
    .order("joined_at");

        if (membersError) throw new Error("Could not load session members.");


    return <SessionRoom sessionId={sessionId} members={sessionMembers}/>
}