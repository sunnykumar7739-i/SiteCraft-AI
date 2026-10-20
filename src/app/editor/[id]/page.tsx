import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Editor } from "@/components/editor/Editor";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/editor/${id}`);
  const db = await getDb();
  const project = await db.getProject(id);
  if (!project || project.userId !== user.id) notFound();
  const variants = await db.listVariants(project.id);

  return (
    <Suspense>
      <Editor project={project} variants={variants} credits={user.credits} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const project = await db.getProject(id);
  return { title: project?.name ?? "Project" };
}
