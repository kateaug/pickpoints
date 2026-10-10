import Link from "next/link";
import { SessionMember } from "../types";
import { Users } from "lucide-react";
import { SessionIdCopyButton } from "./session-id-copy-button";

export function SessionRoom({sessionId, members}: {sessionId: string; members: SessionMember[]}) {
    return (
<main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col px-6 py-10">
      <header className="flex items-center justify-between border-b pb-5">
        <Link href="/" className="text-sm font-semibold">
          Pickpoints
        </Link>
        <span className="text-sm text-muted-foreground">Planning session</span>
      </header>

      <section className="flex-1 py-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm text-muted-foreground">Session code</p>
            <h1 className="mt-1 break-all font-mono text-2xl font-semibold">
              {sessionId}
            </h1>
          </div>
          <SessionIdCopyButton sessionId={sessionId} />
        </div>

        <section className="mt-10 border-t pt-6" aria-labelledby="members-title">
          <div className="flex items-center gap-2">
            <Users size={18} aria-hidden="true" />
            <h2 id="members-title" className="text-lg font-semibold">
              Participants
            </h2>
            <span className="text-sm text-muted-foreground">
              {members.length}
            </span>
          </div>

          {members.length ? (
            <ul className="mt-4 divide-y">
              {members.map((member) => (
                <li
                  key={member.userId}
                  className="flex items-center justify-between py-3"
                >
                  <span>{member.displayName}</span>
                  {member.isAdmin && (
                    <span className="text-xs text-muted-foreground">Host</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              No participants yet.
            </p>
          )}
        </section>
      </section>
    </main>
)};