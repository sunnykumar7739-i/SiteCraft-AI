import { getCurrentUser } from "@/lib/auth";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { Pricing } from "@/components/landing/Pricing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pricing" };

export default async function PricingPage() {
  const user = await getCurrentUser();
  return (
    <div className="paper min-h-screen">
      <Nav signedIn={!!user} />
      <main className="mx-auto max-w-7xl px-5 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="pill text-rust">Flexible Pricing</span>
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">Scale Your Creation</h1>
          <p className="text-cocoa-2 mt-4">Start for free, upgrade when you need to. No hidden fees or contracts. One credit is one generated design or one AI edit.</p>
        </div>
        <div className="mt-12">
          <Pricing currentPlan={user?.plan} ctaHref={user ? "/dashboard/billing" : "/login?mode=signup"} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
