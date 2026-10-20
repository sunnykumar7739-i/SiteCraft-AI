import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { Topbar } from "@/components/dashboard/Topbar";
import { NewProjectWizard } from "@/components/dashboard/NewProjectWizard";

export const metadata = { title: "New site" };

export default async function NewProjectPage() {
  const user = await requireUser();
  return (
    <>
      <Topbar title="Create a new site" />
      <main className="p-4 md:p-8">
        <Suspense>
          <NewProjectWizard credits={user.credits} />
        </Suspense>
      </main>
    </>
  );
}
