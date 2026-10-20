import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Code2, Copy, ExternalLink, Infinity as InfinityIcon, Sparkles, Wand2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { HeroDemo } from "@/components/landing/HeroDemo";
import { GeneratorForm } from "@/components/landing/GeneratorForm";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { Pricing } from "@/components/landing/Pricing";
import { Screenshot, SectionsStudioMock, WalkthroughCard } from "@/components/landing/Mocks";

export const dynamic = "force-dynamic";

const magic = [
  { title: "Futuristic Cyberpunk Style", prompt: "Transform the UI into a futuristic cyberpunk in light yellow theme", img: "/images/cyberpunk.jpg" },
  { title: "Vintage Newspaper Style", prompt: "Give it a vintage newspaper look", img: "/images/news.jpg" },
  { title: "Hand-Drawn Papercut Style", prompt: "Give it a hand-drawn papercut aesthetic", img: "/images/papercut.jpg" },
  { title: "Graffiti Street Art", prompt: "Transform into a graffiti street art style", img: "/images/graffiti.jpg" },
  { title: "Sketchbook Style", prompt: "Transform into a sketchbook style with pencil strokes", img: "/images/sketchbook.jpg" },
  { title: "3D Claymorphism", prompt: "Redesign with a “Claymorphism” 3D style", img: "/images/clay.jpg" },
];

const faqs = [
  ["Can I create a brand-new website from scratch?", "Yes. Choose “New Website”, describe your business, the sections you want and the feel you’re after, and the AI writes a complete responsive page with real copy — no template to start from. Generate again for more directions."],
  ["How does the AI website redesign work?", "Start with a public website URL, a screenshot, or a description. We generate a new layout that you can review and refine with the AI editor or visual editor before exporting the HTML."],
  ["Does it keep my original content?", "Your existing page is the starting point for the redesign. Review the generated text, images, links, and contact details against the original before publishing; AI output can need corrections."],
  ["Can I redesign any website?", "Start with a publicly accessible page you have permission to use. Pages behind a login or sites that block access may not import correctly. You can also upload a screenshot or describe the layout you want."],
  ["Is the generated code mobile-responsive?", "We generate responsive layouts using HTML and Tailwind CSS. Preview the result at phone, tablet, and desktop sizes, and check navigation and forms before launch."],
  ["Can I customize the design after generation?", "Yes. Ask the AI editor to change colors, copy, or layouts, or use the visual editor to adjust individual elements."],
  ["Can I export the code?", "Yes. You can export HTML and Tailwind code to use in your own project. Connect and test any forms, payments, or other backend functionality your website needs."],
  ["Will a website redesign improve my Google ranking?", "A visual redesign does not guarantee higher rankings. Preserve useful content and existing URLs where possible, redirect changed URLs, and check indexing, metadata, links, and performance before publishing."],
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const signedIn = !!user;
  const startHref = signedIn ? "/dashboard/new" : "/login?next=%2Fdashboard%2Fnew";

  return (
    <div className="paper min-h-screen">
      <Nav signedIn={signedIn} />

      {/* ============ HERO ============ */}
      <section className="mx-auto max-w-7xl px-5 pt-14 md:pt-20 pb-10 grid lg:grid-cols-2 gap-12 items-center">
        <div className="min-w-0">
          <div className="eyebrow flex items-center gap-2">
            <Sparkles size={14} /> AI website creator & redesigner · Infinite designs
          </div>
          <h1 className="mt-5 text-4xl sm:text-5xl md:text-[64px] font-extrabold tracking-tight leading-[1.02] break-words">
            Create or redesign any website. <span className="text-rust">Get infinite designs.</span>
          </h1>
          <p className="mt-6 text-lg text-cocoa-2 leading-relaxed max-w-xl">
            Describe a new site or paste your existing URL — {BRAND.assistant} builds it in fresh directions — minimal, bold, luxe,
            playful — with your own content. Not quite right? Hit generate again. There&apos;s always another design.
          </p>
          <Link href={startHref} className="btn-cocoa inline-flex items-center gap-3 mt-8 px-6 py-3.5 text-base">
            <Wand2 size={18} /> Start building free <ArrowRight size={18} />
          </Link>
        </div>
        <div className="min-w-0">
          <HeroDemo />
          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-sand pt-5">
            {[
              [InfinityIcon, "Unlimited directions", "Regenerate as often as you like"],
              [Sparkles, "Create or redesign", "New site from a prompt, or a fresh look for your old one"],
              [Code2, "Yours to keep", "Edit visually, export clean code"],
            ].map(([Icon, t, b]) => {
              const I = Icon as typeof Code2;
              return (
                <div key={t as string}>
                  <I size={16} className="text-rust" />
                  <div className="mt-2 text-sm font-bold">{t as string}</div>
                  <div className="text-xs text-cocoa-2 mt-0.5">{b as string}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ YOUR TURN ============ */}
      <section id="start" className="mx-auto max-w-7xl px-5 py-16">
        <SectionHead eyebrow="Your turn" title="Create a new website. Or redesign the one you have." body={`Describe a brand-new website, add a link, or upload screenshots of your current site — ${BRAND.assistant} returns a set of fresh directions every time.`} />
        <div className="mt-10">
          <GeneratorForm signedIn={signedIn} />
        </div>
        <div className="mt-8">
          <WalkthroughCard />
        </div>
      </section>

      {/* ============ BEFORE / AFTER ============ */}
      <section id="redesign" className="mx-auto max-w-7xl px-5 py-16">
        <SectionHead
          pill="Website Redesigning"
          title="Redesign your outdated website in seconds"
          body="Already have a site? Paste the URL and transform it into a modern masterpiece — same content, brand-new design. See the difference for yourself."
        />
        <p className="text-center text-sm text-cocoa-2 mt-4 max-w-2xl mx-auto">
          Wondering <Link href="#plan" className="text-rust font-semibold underline">how to redesign an existing website</Link>? Need to{" "}
          <Link href="#plan" className="text-rust font-semibold underline">redesign my website</Link> without losing traffic? Before you start your AI website redesign, check out our{" "}
          <Link href="#plan" className="text-rust font-semibold underline">website redesign SEO checklist</Link>.
        </p>
        <div className="mt-10">
          <BeforeAfter />
        </div>
      </section>

      {/* ============ MAGIC INSTRUCTIONS ============ */}
      <section id="magic" className="mx-auto max-w-7xl px-5 py-16">
        <SectionHead pill="Magic Instructions" title={<>Create & redesign like Magic.<br />Just describe it.</>} body="Not sure how to code it? Simply tell our AI what you want in plain English — a whole new website or a change to your existing one — and watch the magic happen instantly. Try these example prompts." />
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {magic.map((m) => (
            <div key={m.title} className="paper-card overflow-hidden">
              <div className="relative aspect-[2/1] bg-paper-2">
                <Image src={m.img} alt={m.title} fill className="object-cover object-top" sizes="(max-width: 640px) 100vw, 400px" />
                <span className="absolute top-3 right-3 pill text-[10px] shadow"><ExternalLink size={10} /> Check Design</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{m.title}</h3>
                  <span className="w-7 h-7 rounded-md border border-sand flex items-center justify-center text-cocoa-3"><Copy size={12} /></span>
                </div>
                <p className="mt-2 text-sm text-cocoa-2 italic bg-paper-2 rounded-lg p-3">“{m.prompt}”</p>
                <Link href={`${startHref}${startHref.includes("?") ? "&" : "?"}i=${encodeURIComponent(m.prompt)}`} className="btn-cocoa mt-3 w-full flex items-center justify-center gap-2 py-2.5 text-sm">
                  <ExternalLink size={14} /> Check Design
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ THEMES ============ */}
      <section id="themes" className="mx-auto max-w-7xl px-5 py-16">
        <SectionHead pill="1,600+ Free AI Themes & Templates" title="Start any website from a professional template" body="Browse 1,600+ production-ready themes and 10,000+ free sections. Copy clean Tailwind CSS or remix live in the AI Studio." />
        <div className="mt-10">
          <Screenshot src="/images/templates.jpg" alt="Template gallery with 1,600+ themes" />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={startHref} className="btn-rust px-6 py-3 text-sm">Explore 1,600+ Free Themes</Link>
          <span className="pill self-center">Free &amp; Open</span>
          <Link href="#sections" className="btn-paper px-6 py-3 text-sm">Browse 10,000+ UI Sections</Link>
        </div>
      </section>

      {/* ============ AI ASSISTANT ============ */}
      <section id="assistant" className="mx-auto max-w-7xl px-5 py-16">
        <SectionHead pill="AI-Powered Design Assistant" title="Chat with AI Design Assistant" body="Simply tell our AI what you want to change and watch your website transform in real-time." />
        <div className="mt-10"><Screenshot src="/images/aieditor.jpg" alt="AI design assistant chat editing a website" /></div>
      </section>

      {/* ============ SECTIONS / AI STUDIO ============ */}
      <section id="sections" className="mx-auto max-w-7xl px-5 py-16">
        <SectionHead pill="✨ 10,000+ Pre-Generated Sections & AI Studio" title="10,000+ Ready-to-Drop Sections. Or Generate Any Layout in Seconds." body="Browse thousands of production-tested sections across Hero, Features, Pricing, Testimonials, and FAQs — or prompt AI to synthesize custom archetypes that automatically match your site’s typography, colors, and layout." />
        <div className="mt-10"><SectionsStudioMock /></div>
        <div className="mt-8 grid md:grid-cols-3 gap-5">
          {[
            ["10,000+ Pre-Built Archetypes", "Instant access to thousands of ready-made section archetypes. Search by category, industry, or visual style and drop straight into your page."],
            ["Intelligent Theme Blending", "Every dropped section automatically analyzes and inherits your active page’s color palette, typography hierarchy, and spacing."],
            ["Multi-Variant AI Generation", "Need bespoke layouts? Describe your vision in one prompt and receive 6 structurally unique designs in under 2 seconds."],
          ].map(([t, b]) => (
            <div key={t} className="paper-card p-6">
              <div className="w-9 h-9 rounded-lg bg-rust/10 text-rust flex items-center justify-center"><Sparkles size={16} /></div>
              <h3 className="mt-4 font-bold">{t}</h3>
              <p className="mt-2 text-sm text-cocoa-2 leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ VISUAL EDITOR ============ */}
      <section id="editor" className="mx-auto max-w-7xl px-5 py-16">
        <SectionHead pill="Visual Design Editor" title="Point, Click & Perfect Your Design" body="Take full control with our intuitive visual editor. Click any element to modify its properties, styles, and content with precision tools." />
        <div className="mt-10"><Screenshot src="/images/visualeditor.jpg" alt="Visual editor: click any element to edit it" /></div>
      </section>

      {/* ============ COMMUNITY ============ */}
      <section id="community" className="mx-auto max-w-7xl px-5 py-16">
        <SectionHead pill="Join the Community" title="Design Better, Together." body="Connect with thousands of designers and developers. Share your AI prompts, get feedback on your redesigned websites, and learn the best tricks to master the visual editor." />
        <div className="mt-10"><Screenshot src="/images/community.jpg" alt="Community feed of shared redesigns and prompts" /></div>
      </section>

      {/* ============ PLAN GUIDE ============ */}
      <section id="plan" className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Plan your website, from first draft to launch</h2>
        <p className="mt-4 text-cocoa-2 leading-relaxed">
          Whether you are creating a brand-new website or redesigning an existing one, the design changes how people find information and take action. {BRAND.full} helps you generate layouts and edit the code. Your content, integrations, and launch checks still need your attention.
        </p>
        <h3 className="mt-8 text-xl font-bold">Start with the problem you want to fix</h3>
        <p className="mt-2 text-cocoa-2 leading-relaxed">
          Is the main action hard to find? Does the mobile layout hide important information? Is the content out of date? Pick a concrete goal before generating a new design. Keep the pages and content that already help your visitors.
        </p>
        <p className="mt-2 text-cocoa-2 leading-relaxed">
          Try the coffee shop design example to explore a product layout. It is a demonstration, not a customer case study or evidence of a ranking increase.
        </p>
        <h3 className="mt-8 text-xl font-bold">How to create or redesign with {BRAND.name}</h3>
        <ol className="mt-3 space-y-2 text-cocoa-2 list-decimal pl-5">
          <li><b className="text-cocoa">Bring your idea or your page.</b> Describe the website you want, enter a public URL you can use, or upload a screenshot.</li>
          <li><b className="text-cocoa">Compare the designs.</b> Review layout, navigation, copy, and imagery against your original page and project goal.</li>
          <li><b className="text-cocoa">Edit and test.</b> Refine the result with the AI or visual editor. Check small screens, keyboard navigation, forms, and links.</li>
          <li><b className="text-cocoa">Export and integrate.</b> Download the HTML, connect the functionality your site needs, and complete your launch checks.</li>
        </ol>
        <h3 className="mt-8 text-xl font-bold">Protect your existing search traffic</h3>
        <p className="mt-2 text-cocoa-2">A new visual design does not automatically preserve or improve Google rankings. Before replacing your live site:</p>
        <ul className="mt-3 space-y-2 text-cocoa-2 list-disc pl-5">
          <li>Record your important pages, search traffic, titles, and existing URLs.</li>
          <li>Keep useful content and URLs. Map changed URLs to relevant replacements with permanent redirects.</li>
          <li>Check canonical tags, indexing settings, internal links, and mobile performance.</li>
          <li>Test the published site and monitor Search Console after launch.</li>
        </ul>
        <h3 className="mt-8 text-xl font-bold">Choose the right level of help</h3>
        <p className="mt-2 text-cocoa-2 leading-relaxed">
          Use {BRAND.name} when you want to generate and edit a front-end design yourself. An agency or developer may be useful when the project also needs content strategy, a CMS migration, custom integrations, or someone to manage launch and testing. Generated layouts do not replace your application backend.
        </p>
        <p className="mt-2 text-cocoa-2 leading-relaxed">
          The free plan lets you try the workflow; paid plans provide additional usage. See <Link href="/pricing" className="text-rust underline">current plans and limits</Link> to plan your budget.
        </p>
        <div className="mt-10 paper-card p-8 text-center">
          <h3 className="text-2xl font-extrabold">Create your first website — or redesign your current one</h3>
          <p className="mt-2 text-cocoa-2">Start with one page, review the result, and decide what to change before publishing. 15 free credits every month.</p>
          <Link href={startHref} className="btn-cocoa inline-flex items-center gap-2 mt-6 px-6 py-3">
            <Wand2 size={16} /> Start building free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="mx-auto max-w-7xl px-5 py-16">
        <SectionHead pill="Flexible Pricing" title="Scale Your Creation" body="Start for free, upgrade when you need to. No hidden fees or contracts." />
        <div className="mt-12">
          <Pricing currentPlan={user?.plan} ctaHref={signedIn ? "/dashboard/billing" : "/login?mode=signup"} />
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-16">
        <SectionHead pill="FAQ" title="Frequently Asked Questions" body="What to expect when creating or redesigning your website with AI." />
        <div className="mt-10 space-y-3">
          {faqs.map(([q, a]) => (
            <details key={q} className="group paper-card px-5 py-4">
              <summary className="cursor-pointer list-none flex justify-between items-center font-semibold gap-4">
                <span className="flex items-center gap-2"><Sparkles size={14} className="text-rust shrink-0" /> {q}</span>
                <span className="text-cocoa-3 group-open:rotate-180 transition-transform">⌄</span>
              </summary>
              <p className="mt-3 text-sm text-cocoa-2 leading-relaxed pl-6">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function SectionHead({ eyebrow, pill, title, body }: { eyebrow?: string; pill?: string; title: React.ReactNode; body?: string }) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      {pill && <span className="pill text-rust"><Sparkles size={12} /> {pill}</span>}
      <h2 className="mt-4 text-3xl md:text-[44px] font-extrabold tracking-tight leading-[1.1]">{title}</h2>
      {body && <p className="mt-4 text-cocoa-2 text-base md:text-lg leading-relaxed">{body}</p>}
    </div>
  );
}
