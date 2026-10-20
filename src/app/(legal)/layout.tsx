import { getCurrentUser } from "@/lib/auth";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";

export const dynamic = "force-dynamic";

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="paper min-h-screen">
      <Nav signedIn={!!user} />
      <main className="mx-auto max-w-3xl px-5 py-16">{children}</main>
      <Footer />
    </div>
  );
}
