export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/app/Sidebar";
import Topbar from "@/components/app/Topbar";
import { SidebarProvider } from "@/components/app/SidebarContext";
import ServiceWorkerRegistrar from "@/components/app/ServiceWorkerRegistrar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Stale/invalid refresh token — redirect to login
  }

  if (!user) redirect("/login");

  return (
    <SidebarProvider>
      <ServiceWorkerRegistrar />
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
