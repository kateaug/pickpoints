import { CreateOrJoinForm } from "@/components/session/create-or-join-form";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <CreateOrJoinForm />
      </div>
    </main>
  );
}
