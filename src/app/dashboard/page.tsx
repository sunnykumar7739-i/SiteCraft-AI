import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Topbar } from "@/components/dashboard/Topbar";
import { ProjectCard } from "@/components/dashboard/ProjectCard";

export const metadata = { title: "Projects" };

export default async function DashboardPage() {
  const user = await requireUser();
  const db = await getDb();
  const projects = await db.listProjects(user.id);
  const previews = await Promise.all(
    projects.map(async (p) => {
      if (!p.activeVariantId) return null;
      const v = await db.getVariant(p.activeVariantId);
      return v?.html ?? null;
    }),
  );

  return (
    <>
      <Topbar
        title="Projects"
        actions={
          <Link href="/dashboard/new" className="hidden md:inline-flex btn-gold rounded-full px-4 py-2 text-sm items-center gap-1.5">
            <Plus size={16} /> New site
          </Link>
        }
      />
      <main className="p-4 md:p-8">
        {projects.length === 0 ? (
          <EmptyState name={user.name} />
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            <Link
              href="/dashboard/new"
              className="card border-dashed border-line-strong hover:border-gold/60 flex flex-col items-center justify-center gap-2 min-h-56 text-fg-muted hover:text-gold transition"
            >
              <span className="w-12 h-12 rounded-full bg-gold-dim flex items-center justify-center">
                <Plus size={22} />
              </span>
              <span className="text-sm font-medium">Create a new site</span>
            </Link>
            {projects.map((p, i) => (
              <ProjectCard key={p.id} project={p} previewHtml={previews[i]} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function EmptyState({ name }: { name: string | null }) {
  return (
    <div className="card p-10 md:p-16 text-center max-w-2xl mx-auto mt-10 glow">
      <h2 className="text-2xl font-bold">Welcome{name ? `, ${name.split(" ")[0]}` : ""} 👋</h2>
      <p className="text-fg-muted mt-2">
        You haven’t created a site yet. Paste a URL, upload a screenshot or describe an idea — you’ll have designs
        in under a minute.
      </p>
      <Link href="/dashboard/new" className="btn-gold inline-flex items-center gap-2 mt-8 rounded-full px-6 py-3">
        <Plus size={18} /> Create your first site
      </Link>
    </div>
  );
}
