import Image from "next/image";
import { Bot, Check, ChevronLeft, ChevronRight, Globe, Layers, MessageSquare, MousePointer2, Play, Send, Sparkles, Users } from "lucide-react";
import { BRAND } from "@/lib/brand";

/* ---------- shared: fake app chrome ---------- */
function AppFrame({ children, sidebar = true }: { children: React.ReactNode; sidebar?: boolean }) {
  return (
    <div className="paper-card overflow-hidden grid md:grid-cols-[200px_1fr] text-cocoa">
      {sidebar && (
        <aside className="hidden md:flex flex-col border-r border-sand bg-[#fffcf7] p-4 text-xs">
          <div className="font-bold text-base">
            {BRAND.name}
            <span className="text-rust">{BRAND.tld}</span>
          </div>
          <div className="mt-4 eyebrow">Usage</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-sand p-2">
              <div className="text-[9px] text-cocoa-3">Credits</div>
              <div className="font-bold text-rust">7585</div>
            </div>
            <div className="rounded-lg border border-sand p-2">
              <div className="text-[9px] text-cocoa-3">Tokens</div>
              <div className="font-bold text-rust">97.7M</div>
            </div>
          </div>
          <ul className="mt-5 space-y-1">
            {["My Websites", "Community", "Templates", "Billing", "Refer & Earn"].map((x, i) => (
              <li key={x} className={`px-2 py-1.5 rounded-md ${i === 2 ? "bg-paper-2 font-semibold" : "text-cocoa-2"}`}>
                {x}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-rust/20" />
            <div>
              <div className="font-semibold">{BRAND.byline}</div>
              <div className="text-[9px] text-cocoa-3">you@{BRAND.full}</div>
            </div>
          </div>
        </aside>
      )}
      <div className="p-4 md:p-6 min-w-0">{children}</div>
    </div>
  );
}

const gradients = [
  "from-indigo-600 to-violet-800",
  "from-stone-900 to-stone-700",
  "from-emerald-500 to-teal-700",
  "from-orange-400 to-rose-600",
  "from-sky-500 to-blue-800",
  "from-fuchsia-500 to-purple-800",
];

/* ---------- Templates gallery ---------- */
export function TemplatesMock() {
  return (
    <AppFrame>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold">Template Categories</div>
          <div className="text-[11px] text-cocoa-2">Browse our collection of professionally designed templates. Click “Remix” to customise any template with your own content and branding.</div>
        </div>
        <span className="text-[10px] text-rust font-semibold whitespace-nowrap">Your plan: Developer</span>
      </div>
      <div className="mt-3 flex items-center gap-1 text-[10px]">
        <span className="pill"><ChevronLeft size={10} /> Previous</span>
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={`w-5 h-5 rounded-full flex items-center justify-center ${n === 1 ? "bg-rust text-white" : "border border-sand"}`}>{n}</span>
        ))}
        <span>… 149</span>
        <span className="pill">Next <ChevronRight size={10} /></span>
        <span className="ml-auto text-cocoa-3">1–6 of 9</span>
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
        {["Bridging Ambition & Assurance in Financial AI", "Platform Name:", "Craft High-Quality Web Experiences", "TOKEN NAME: Your Key to the Digital Universe", "From Vision to Digital Reality. Instantly.", "Innovators of the Decentralized Ecosystem"].map((t, i) => (
          <div key={t} className="rounded-lg border border-sand overflow-hidden bg-white">
            <div className={`h-20 bg-gradient-to-br ${gradients[i]} p-2 text-white text-[10px] font-bold leading-tight flex items-end`}>{t}</div>
            <div className="p-2 text-[9px]">
              <div className="truncate text-cocoa-2">Template ffc4ae6a-3fdf-4263-9420-37…</div>
              <div className="mt-1.5 flex gap-1">
                <span className="pill text-[9px] py-0.5">Preview</span>
                <span className="rounded-full bg-rust text-white px-2 py-0.5 font-semibold">Use This Design</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppFrame>
  );
}

/* ---------- AI chat assistant ---------- */
export function AssistantMock() {
  return (
    <div className="paper-card overflow-hidden grid md:grid-cols-[320px_1fr]">
      <div className="border-r border-sand bg-[#fffcf7] p-4 flex flex-col text-xs">
        <div className="flex items-center gap-2 font-bold"><Bot size={14} className="text-rust" /> AI Design Assistant</div>
        <div className="mt-4 space-y-3 flex-1">
          <div className="bg-paper-2 rounded-xl rounded-bl-sm p-2.5 w-fit max-w-[90%]">Hi! What would you like to change on this page?</div>
          <div className="bg-rust text-white rounded-xl rounded-br-sm p-2.5 w-fit max-w-[90%] ml-auto">Make the hero dark with a gold accent and add a testimonials section</div>
          <div className="bg-paper-2 rounded-xl rounded-bl-sm p-2.5 w-fit max-w-[90%]">
            <div className="flex items-center gap-1 text-green-700 font-semibold"><Check size={11} /> Applied 2 changes</div>
            Hero switched to dark + gold, testimonials added below features. Want 3 or 6 quotes?
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-sand-2 bg-white px-3 py-2">
          <span className="text-cocoa-3 flex-1">Tell the AI what to change…</span>
          <Send size={12} className="text-rust" />
        </div>
      </div>
      <div className="p-4 bg-paper-2">
        <div className="rounded-xl overflow-hidden border border-sand bg-white">
          <div className="bg-[#14100b] text-[#f5ecd8] p-5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold">BRAND</span>
              <span className="bg-[#d4a853] text-black rounded-full px-2 py-0.5 font-bold">Book now</span>
            </div>
            <div className="mt-6 text-xl md:text-2xl font-black leading-tight max-w-xs">
              Premium craft, <span className="text-[#d4a853]">delivered daily.</span>
            </div>
            <div className="mt-2 h-2 w-2/3 rounded bg-white/20" />
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            {["“Best decision we made this year.”", "“Setup took 10 minutes. Wow.”", "“Our conversions doubled.”"].map((q) => (
              <div key={q} className="rounded-lg border border-sand p-2.5 text-[10px]">
                <div className="text-[#d4a853]">★★★★★</div>
                <div className="mt-1 font-medium">{q}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 10k sections / AI studio ---------- */
export function SectionsStudioMock() {
  const cards: { k: string; t: string; body: React.ReactNode }[] = [
    {
      k: "three-tier-cards",
      t: "3-Tier Grid",
      body: (
        <div className="grid grid-cols-3 gap-1 text-[8px]">
          {[["Basic", "$19", "5 Sites"], ["Pro", "$49", "10k+ Sections"], ["Team", "$99", "Unlimited"]].map(([n, p, f], i) => (
            <div key={n} className={`rounded border p-1.5 ${i === 1 ? "bg-rust text-white border-rust" : "border-sand"}`}>
              <div className="font-bold">{n}</div>
              <div className="text-sm font-black">{p}</div>
              <div>✓ {f}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      k: "toggle-monthly-annual",
      t: "Interactive Toggle",
      body: (
        <div className="text-[8px]">
          <div className="flex justify-center gap-1 mb-1"><span className="px-1.5 rounded bg-cocoa text-white">Mo</span><span className="px-1.5 rounded border border-sand">Year -25%</span></div>
          <div className="grid grid-cols-3 gap-1">{["$14", "$36", "$79"].map((p) => <div key={p} className="rounded border border-sand p-1.5 text-center font-black">{p}</div>)}</div>
        </div>
      ),
    },
    {
      k: "comparison-table",
      t: "Spec Table",
      body: (
        <table className="w-full text-[8px]">
          <tbody>
            {[["Plan", "Free", "Pro", "Ent"], ["10k+ Library", "10", "∞", "∞"], ["DOM Blend", "—", "✓", "✓"], ["Export Code", "HTML", "Next", "All"], ["Price", "$19", "$49", "$199"]].map((r) => (
              <tr key={r[0]} className="border-b border-sand">{r.map((c, i) => <td key={i} className={`py-0.5 ${i === 0 ? "font-bold" : "text-center"}`}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      ),
    },
    {
      k: "single-plan-feature-list",
      t: "Founder Pass",
      body: (
        <div className="text-[8px] rounded border border-sand p-2 bg-[#14100b] text-white">
          <div className="text-[7px] tracking-widest opacity-70">LIFETIME</div>
          <div className="text-base font-black">$149</div>
          <div className="mt-1">✓ 10,000+ Sections · ✓ Auto Theme Blend · ✓ Tailwind & Next.js</div>
        </div>
      ),
    },
    {
      k: "horizontal-stacked-rows",
      t: "Row Stack",
      body: (
        <div className="text-[8px] space-y-1">
          {[["Starter", "$19"], ["Pro Plan", "$49"], ["Enterprise", "$199"]].map(([n, p]) => (
            <div key={n} className="flex justify-between rounded border border-sand px-2 py-1"><span className="font-bold">{n}</span><span>{p}</span></div>
          ))}
        </div>
      ),
    },
    {
      k: "two-tier-split-panel",
      t: "Split Panel",
      body: (
        <div className="grid grid-cols-2 gap-1 text-[8px]">
          <div className="rounded border border-sand p-1.5"><div className="font-bold">Ship Faster</div>Zero lock-in.<br />✓ 10k+ Sections</div>
          <div className="rounded bg-rust text-white p-1.5"><div className="font-bold">AGENCY</div><div className="text-sm font-black">$249</div>Deploy</div>
        </div>
      ),
    },
  ];
  return (
    <div className="paper-card p-5 md:p-7">
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex-1 flex items-center gap-2 rounded-xl border border-sand-2 bg-white px-3 py-2.5 text-sm">
          <Sparkles size={15} className="text-rust" />
          <span className="text-cocoa-2">a pricing section with three tiers, yearly toggle & feature matrix</span>
          <span className="ml-auto bg-cocoa text-white text-[11px] rounded-lg px-2.5 py-1 font-semibold">Generate</span>
        </div>
        <div className="flex gap-1.5 flex-wrap text-[11px]">
          <span className="pill"><Layers size={11} /> 10,000+ Library</span>
          <span className="pill">Pricing (320+)</span>
          <span className="pill">Hero (600+)</span>
          <span className="pill">Testimonials (390+)</span>
          <span className="pill">FAQ (300+)</span>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-[11px] font-bold tracking-widest text-cocoa-3">
        <span>6 ARCHETYPE VARIANTS</span>
        <span className="pill text-[10px]"><Check size={10} className="text-green-700" /> Theme-Matched</span>
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((c, i) => (
          <div key={c.k} className={`rounded-xl border p-3 bg-white ${i === 2 ? "border-rust ring-2 ring-rust/20" : "border-sand"}`}>
            {c.body}
            <div className="mt-2 text-[9px] text-cocoa-3 font-mono">{c.k}</div>
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold">{c.t}</div>
              {i === 2 && <span className="text-[9px] text-green-700 font-bold">✓ DROPPED TO CANVAS</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Visual editor ---------- */
export function VisualEditorMock() {
  return (
    <div className="paper-card overflow-hidden grid md:grid-cols-[1fr_260px]">
      <div className="bg-paper-2 p-4 md:p-6">
        <div className="rounded-xl border border-sand bg-white overflow-hidden text-cocoa">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-sand text-[10px] font-semibold">
            <span>Northwind Studio</span>
            <span className="flex gap-3 text-cocoa-2"><span>Work</span><span>About</span><span>Contact</span></span>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4 items-center">
            <div>
              <div className="relative inline-block">
                <div className="text-lg md:text-2xl font-black leading-tight ring-2 ring-rust ring-offset-2 rounded-sm px-0.5">We design brands people remember.</div>
                <span className="absolute -top-5 left-0 bg-rust text-white text-[9px] px-1.5 py-0.5 rounded font-mono">h1.hero-title</span>
                <MousePointer2 size={14} className="absolute -right-3 -bottom-2 text-cocoa" />
              </div>
              <div className="mt-2 h-2 w-5/6 rounded bg-paper-3" />
              <div className="mt-1 h-2 w-3/5 rounded bg-paper-3" />
              <div className="mt-3 inline-block bg-cocoa text-white text-[10px] rounded-full px-3 py-1 font-semibold">Start a project</div>
            </div>
            <div className="aspect-square rounded-xl bg-gradient-to-br from-rust-2 to-rust" />
          </div>
        </div>
      </div>
      <aside className="border-l border-sand bg-[#fffcf7] p-4 text-xs space-y-3">
        <div className="font-bold flex items-center gap-1.5"><MousePointer2 size={12} className="text-rust" /> Selected: h1</div>
        {[["Text", "We design brands people remember."], ["Font size", "28px"], ["Weight", "800"], ["Color", "#2c1810"], ["Padding", "0 2px"]].map(([k, v]) => (
          <div key={k}>
            <div className="text-[9px] uppercase tracking-wider text-cocoa-3">{k}</div>
            <div className="mt-0.5 rounded-md border border-sand bg-white px-2 py-1.5 flex items-center gap-2 truncate">
              {k === "Color" && <span className="w-3 h-3 rounded-full bg-cocoa" />}
              {v}
            </div>
          </div>
        ))}
        <div className="rounded-lg bg-rust text-white text-center py-1.5 font-semibold">Save changes</div>
      </aside>
    </div>
  );
}

/* ---------- Community ---------- */
export function CommunityMock() {
  const posts = [
    ["Aarav S.", "Turned my 2012 agency site into this in 20 minutes 🔥", "Midnight Luxe", 128],
    ["Priya M.", "Prompt that works every time: “editorial grid, serif headlines, cream bg”", "Editorial", 96],
    ["Diego R.", "Before/after of a restaurant site — client said yes on the spot", "Soft Clay", 74],
  ] as const;
  return (
    <div className="paper-card p-5 md:p-7 grid md:grid-cols-3 gap-4">
      {posts.map(([name, text, theme, likes], i) => (
        <div key={name} className="rounded-xl border border-sand bg-white overflow-hidden">
          <div className={`h-28 bg-gradient-to-br ${gradients[i + 1]} p-3 flex items-end text-white text-[10px] font-bold`}>{theme}</div>
          <div className="p-3 text-xs">
            <div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-rust/20" /><span className="font-semibold">{name}</span></div>
            <p className="mt-2 text-cocoa-2 leading-snug">{text}</p>
            <div className="mt-3 flex gap-3 text-[11px] text-cocoa-3"><span>♥ {likes}</span><span className="flex items-center gap-1"><MessageSquare size={10} /> {Math.round(likes / 4)}</span></div>
          </div>
        </div>
      ))}
      <div className="md:col-span-3 flex items-center justify-center gap-2 text-xs text-cocoa-2"><Users size={13} className="text-rust" /> 12,400+ members sharing prompts, feedback and redesigns</div>
    </div>
  );
}

/* ---------- Walkthrough video card ---------- */
export function WalkthroughCard() {
  return (
    <a href="#start" className="paper-card p-4 flex items-center gap-5 max-w-3xl mx-auto hover:border-rust/50 transition">
      <div className="relative w-40 h-24 rounded-lg shrink-0 overflow-hidden bg-cocoa">
        <Image src="/images/poster.jpg" alt="Product walkthrough" fill className="object-cover" sizes="160px" />
        <span className="absolute inset-0 flex items-center justify-center"><span className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-cocoa"><Play size={16} fill="currentColor" /></span></span>
      </div>
      <div>
        <div className="font-bold">See the full {BRAND.name} product walkthrough</div>
        <div className="text-sm text-cocoa-2 mt-1">Watch how a site is redesigned, edited with AI and published</div>
      </div>
    </a>
  );
}

export function GlobeIcon() {
  return <Globe size={14} />;
}


/* ---------- Full-width product screenshot (replaces CSS mocks) ---------- */
export function Screenshot({ src, alt, ratio = "1000 / 551" }: { src: string; alt: string; ratio?: string }) {
  return (
    <div className="paper-card overflow-hidden p-2 md:p-3 glow-soft">
      <div className="relative w-full rounded-xl overflow-hidden border border-sand" style={{ aspectRatio: ratio }}>
        <Image src={src} alt={alt} fill className="object-cover object-top" sizes="(max-width: 1280px) 100vw, 1200px" />
      </div>
    </div>
  );
}
