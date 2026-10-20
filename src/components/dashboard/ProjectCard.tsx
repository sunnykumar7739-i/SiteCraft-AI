"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Globe, Image as ImageIcon, PenLine, Trash2 } from "lucide-react";
import type { Project } from "@/lib/types";

const sourceIcon = { url: Globe, screenshot: ImageIcon, describe: PenLine };

export function ProjectCard({ project, previewHtml }: { project: Project; previewHtml: string | null }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const Icon = sourceIcon[project.sourceType];

  const remove = async () => {
    if (!confirm(`Delete “${project.name}”? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className={`card overflow-hidden group hover:border-gold/50 transition flex flex-col relative ${deleting ? "opacity-40" : ""}`}>
      {/* Whole-card link (overlay) */}
      <Link href={`/editor/${project.id}`} className="absolute inset-0 z-10" aria-label={`Open ${project.name}`} />

      <div className="relative h-40 bg-cream overflow-hidden">
        {previewHtml ? (
          <iframe
            srcDoc={previewHtml}
            sandbox="allow-scripts"
            tabIndex={-1}
            title={project.name}
            className="w-[1400px] h-[640px] origin-top-left scale-[0.25] pointer-events-none select-none"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ink-muted text-sm">
            {project.status === "generating" ? "Generating…" : "No design yet"}
          </div>
        )}
        <span
          className={`absolute top-2 left-2 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
            project.status === "ready" ? "bg-success/90 text-white" : project.status === "failed" ? "bg-danger text-white" : "bg-ink/70 text-white"
          }`}
        >
          {project.status}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start gap-2">
          <Icon size={16} className="text-gold mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{project.name}</div>
            <div className="text-xs text-fg-dim truncate">{project.sourceUrl || project.description || "Screenshot"}</div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-fg-dim">
          <span suppressHydrationWarning>{new Date(project.updatedAt).toLocaleDateString()}</span>
          <div className="relative z-20 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition">
            {project.publishedSlug && (
              <a href={`/s/${project.publishedSlug}`} target="_blank" rel="noreferrer" className="hover:text-gold" title="Open published site">
                <ExternalLink size={14} />
              </a>
            )}
            <button onClick={remove} className="hover:text-danger" title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
