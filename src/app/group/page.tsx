<!DOCTYPE html><html lang="en" style=""><head><meta charset="utf-8"><meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" name="viewport"><meta content="mobile" name="device-type"><link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet"><link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet"><style>
  @layer base {
    html, body {
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      overscroll-behavior-y: contain;
    }
  }
  ::-webkit-scrollbar { display: none; }
</style><script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script><script id="tailwind-config">tailwind.config = {darkMode: "class", theme: {extend: {colors: {"primary-container": "#006e2e", "secondary-container": "#ffcd71", "error-container": "#ffdad6", "on-primary": "#ffffff", tertiary: "#872200", "secondary-fixed-dim": "#efbf65", "surface-bright": "#f8f9ff", "surface-tint": "#006e2e", background: "#f8f9ff", "on-error": "#ffffff", "primary-fixed-dim": "#7eda8d", surface: "#f8f9ff", "on-background": "#171c22", primary: "#005321", "on-tertiary-container": "#ffcfc1", "secondary-fixed": "#ffdea7", "on-primary-container": "#91ee9e", "on-secondary": "#ffffff", "inverse-primary": "#7eda8d", "on-secondary-fixed-variant": "#5e4200", "surface-container-highest": "#dee3eb", error: "#ba1a1a", outline: "#6f7a6e", "tertiary-container": "#b12f00", "inverse-on-surface": "#edf1f9", "surface-variant": "#dee3eb", "primary-fixed": "#9af7a7", "tertiary-fixed": "#ffdbd1", "on-primary-fixed-variant": "#005321", "on-tertiary-fixed-variant": "#862200", "outline-variant": "#becabb", "on-primary-fixed": "#002109", "inverse-surface": "#2c3137", "on-surface": "#171c22", "on-tertiary": "#ffffff", "on-error-container": "#93000a", secondary: "#7c5800", "surface-container": "#eaeef7", "tertiary-fixed-dim": "#ffb5a0", "surface-container-high": "#e4e8f1", "on-tertiary-fixed": "#3b0900", "on-secondary-fixed": "#271900", "surface-container-lowest": "#ffffff", "on-secondary-container": "#785500", "surface-dim": "#d6dae3", "on-surface-variant": "#3f493f", "surface-container-low": "#f0f4fc"}, fontFamily: {sans: ["Inter", "sans-serif"], body: ["Inter"], headline: ["Inter"], display: ["Inter"], label: ["Inter"]}, fontSize: {}, borderRadius: {DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px"}}}};</script><style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head><body class="bg-surface font-sans text-on-surface antialiased min-h-screen pb-28 flex flex-col items-center">
<!-- Mobile Viewport Wrapper (390px iPhone constraint) -->
<div class="w-full max-w-[390px] min-h-screen bg-background flex flex-col relative shadow-2xl">
<!-- 1. Top Bar / Mobile Header (GrabFood Style Header) -->
<header class="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-surface-container-high px-4 pt-3 pb-3">
<!-- User Profile & Campus Dropdown Row -->
<div class="flex items-center justify-between gap-2 mb-2.5">
<div class="flex items-center gap-2">
<img alt="makanApa" class="h-7 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1XwHww4WBIk_EahyYLhxGcuGsjZunZG06lG-Qd639GzuoAmY2qVWWznCpyEccMxocJWwDJp5NNeI-xxHcBhxfF1LNKxCu9bddjeqgU7LuGGtuP-vX-27Hz5FJCfYWyhEnNrj8jCcGm0jPXWcVT28Iv-i_YM4khI0YzE-e1VQcfvQd0g-N7PuKlaDhvE5FbiaSjwu8dO3KEDE9DtLnX0rwW12obi79_wwhu7oxFrG2wQVA">
</div>
<div class="flex items-center gap-1 shrink-0">
<button aria-label="Search" class="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors">
<span class="material-symbols-outlined text-[18px]">search</span>
</button>
<button aria-label="Notifications" class="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface relative transition-colors">
<span class="material-symbols-outlined text-[18px]">notifications</span>
<span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-tertiary-container"></span>
</button>
</div>
</div>
<!-- Active Filter Summary Pill & Mode Strip -->
<div class="flex items-center justify-between gap-2 pt-0.5">
<div class="flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant/60 rounded-full py-1 px-2.5 shadow-xs flex-1 min-w-0">
<span class="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse shrink-0"></span>
<span class="text-[11px] font-semibold text-on-surface truncate">
            ⚡ RM15 • ⏱️ 30m • 🚶 Walk • Halal
          </span>
<button aria-label="Edit filters" class="ml-auto text-primary text-[11px] font-bold shrink-0 hover:underline">
            Edit
          </button>
</div>
<button class="shrink-0 p-1.5 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors">
<span class="material-symbols-outlined text-[16px]">tune</span>
</button>
</div>
</header>
<!-- Main Scrollable Feed -->
<main class="flex-1 px-3.5 pt-3.5 flex flex-col gap-3.5 pb-28">
<!-- 2. Group Consensus Live Banner Alert Card -->
<section class="bg-gradient-to-r from-secondary-fixed/40 via-surface-container-lowest to-primary-fixed/20 border border-secondary-container/40 rounded-2xl p-3 shadow-xs">
<div class="flex items-start justify-between gap-2 mb-2">
<div class="flex items-center gap-1.5">
<span class="w-2 h-2 rounded-full bg-primary-container animate-ping"></span>
<span class="text-[11px] font-extrabold uppercase tracking-wide text-secondary flex items-center gap-1">
<span class="material-symbols-outlined text-[14px]">groups</span>
              Group Consensus Active
            </span>
</div>
<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-secondary-container text-on-secondary-container font-mono">
            #UM-892
          </span>
</div>
<div class="flex items-center justify-between gap-2">
<!-- Stacked Avatars + Status -->
<div class="flex items-center gap-2 min-w-0">
<div class="flex -space-x-2 shrink-0">
<div class="w-7 h-7 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-[11px] flex items-center justify-center border-2 border-white shadow-xs">
                A
              </div>
<div class="w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold text-[11px] flex items-center justify-center border-2 border-white shadow-xs">
                S
              </div>
<div class="w-7 h-7 rounded-full bg-primary text-on-primary font-bold text-[11px] flex items-center justify-center border-2 border-white shadow-xs">
                You
              </div>
</div>
<p class="text-xs font-semibold text-on-surface truncate">
              3 friends voted • <span class="text-primary font-bold">1 spot ready</span>
</p>
</div>
<!-- Switch to Consensus Room -->
<button class="shrink-0 text-xs font-bold text-on-primary bg-primary-container hover:bg-primary px-3 py-1.5 rounded-full shadow-xs flex items-center gap-1 transition-all active:scale-95">
<span class="">View</span>
<span class="material-symbols-outlined text-[13px]">arrow_forward</span>
</button>
</div>
</section>
<!-- Section Title & Meta -->
<div class="flex items-center justify-between px-0.5 pt-1">
<div class="flex items-center gap-1.5">
<span class="material-symbols-outlined text-primary text-[20px]">psychology</span>
<h1 class="font-bold text-sm text-on-surface">Gemini AI Recommendations</h1>
</div>
<span class="text-[11px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
          3 Ranked Matches
        </span>
</div>
<!-- 3. Recommendations Feed (Vertical GrabFood Merchant Cards) -->
<!-- CARD 1: KK11 (Match #1, 98% Fit) -->
<article class="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 overflow-hidden flex flex-col transition-all hover:shadow-md">
<!-- Banner Image Placeholder Area -->
<div class="relative w-full h-36 bg-surface-container-low flex flex-col items-center justify-center text-on-surface-variant group cursor-pointer border-b border-surface-container">
<div class="flex flex-col items-center justify-center gap-1 text-center px-4">
<span class="material-symbols-outlined text-3xl text-outline group-hover:scale-110 transition-transform">add_photo_alternate</span>
<span class="text-[11px] font-medium text-on-surface-variant">Food / Stall Photo (Tap to upload)</span>
</div>
<!-- Top-Left Walk Distance Pill -->
<div class="absolute top-2.5 left-2.5 bg-surface-container-lowest/95 backdrop-blur-md px-2 py-0.5 rounded-full text-on-surface shadow-xs flex items-center gap-1 border border-outline-variant/30">
<span class="material-symbols-outlined text-primary text-[13px]">directions_walk</span>
<span class="text-[10px] font-bold">5-min walk (Engineering Canteen)</span>
</div>
<!-- Top-Right Fit Badge -->
<div class="absolute top-2.5 right-2.5 bg-primary-fixed text-on-primary-fixed-variant px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-xs">
            #1 Match • 98% Fit
          </div>
</div>
<!-- Card Content -->
<div class="p-3.5 flex flex-col gap-2.5">
<!-- Vendor & Location Header -->
<div class="flex items-start justify-between gap-2">
<div>
<div class="flex items-center gap-1.5">
<h2 class="font-bold text-base text-on-surface leading-tight">Canteen Kinabalu (KK11)</h2>
</div>
<p class="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
<span class="">Stall 4: Makcik Kunyit</span>
<span class="">•</span>
<span class="text-[11px] text-primary font-semibold">220m from FCSIT</span>
</p>
</div>
<!-- Price Display -->
<div class="text-right shrink-0">
<div class="text-lg font-black text-primary leading-tight">RM 8.50</div>
<span class="text-[10px] text-on-surface-variant line-through block">RM 10.00</span>
</div>
</div>
<!-- Optimal Meal Item & Live Queue Status -->
<div class="bg-surface-container-low rounded-xl p-2.5 flex flex-col gap-1.5">
<div class="flex items-center justify-between gap-1">
<div class="flex items-center gap-1.5 min-w-0">
<span class="font-bold text-xs text-on-surface truncate">Nasi Ayam Kunyit Panas + Sambal</span>
</div>
<span class="text-[10px] font-bold text-on-primary bg-primary px-1.5 py-0.2 rounded shrink-0">
                Subsidy
              </span>
</div>
<!-- Queue Counter Metric -->
<div class="flex items-center justify-between text-[11px] font-semibold pt-0.5 border-t border-surface-container/60">
<span class="text-primary flex items-center gap-1 font-bold">
<span class="w-2 h-2 rounded-full bg-primary-container"></span>
                🟢 Low queue: ~4 mins wait
              </span>
<span class="text-on-surface-variant text-[10px]">
                ⏱️ 14m total door-to-door
              </span>
</div>
</div>
<!-- Gemini AI Insight Box -->
<div class="rounded-xl p-2.5 bg-secondary-fixed/30 border border-secondary-fixed/50 text-on-surface flex items-start gap-2">
<span class="text-base shrink-0 leading-none mt-0.5">💡</span>
<p class="text-[11px] leading-snug font-medium text-on-surface">
<strong class="font-bold text-on-secondary-fixed">Gemini Pick:</strong> Zero shuttle delay needed, RM6.50 under your RM15 cap, and certified 100% Jakim Halal.
            </p>
</div>
<!-- Card Actions (Grab Style Action Row) -->
<div class="grid grid-cols-2 gap-2 pt-0.5">
<button class="w-full py-2 px-3 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95">
<span class="material-symbols-outlined text-[15px] text-primary">near_me</span>
<span class="">Directions</span>
</button>
<button class="w-full py-2 px-3 rounded-full bg-primary-container hover:bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95">
<span class="">View Stall</span>
<span class="material-symbols-outlined text-[15px]">arrow_forward</span>
</button>
</div>
</div>
</article>
<!-- CARD 2: Arts Food Arcade (Match #2, 92% Fit) -->
<article class="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 overflow-hidden flex flex-col transition-all hover:shadow-md">
<!-- Banner Image Placeholder Area -->
<div class="relative w-full h-36 bg-surface-container-low flex flex-col items-center justify-center text-on-surface-variant group cursor-pointer border-b border-surface-container">
<div class="flex flex-col items-center justify-center gap-1 text-center px-4">
<span class="material-symbols-outlined text-3xl text-outline group-hover:scale-110 transition-transform">add_photo_alternate</span>
<span class="text-[11px] font-medium text-on-surface-variant">Food / Stall Photo (Tap to upload)</span>
</div>
<!-- Shuttle Pill -->
<div class="absolute top-2.5 left-2.5 bg-surface-container-lowest/95 backdrop-blur-md px-2 py-0.5 rounded-full text-on-surface shadow-xs flex items-center gap-1 border border-outline-variant/30">
<span class="material-symbols-outlined text-secondary text-[13px]">directions_bus</span>
<span class="text-[10px] font-bold">Shuttle Stop 3 (8 mins)</span>
</div>
<!-- Match #2 Badge -->
<div class="absolute top-2.5 right-2.5 bg-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
            #2 Match • 92% Fit
          </div>
</div>
<!-- Card Content -->
<div class="p-3.5 flex flex-col gap-2.5">
<div class="flex items-start justify-between gap-2">
<div>
<h2 class="font-bold text-base text-on-surface leading-tight">Faculty of Arts Arcade</h2>
<p class="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
<span class="">Stall 9: Selera Warisan</span>
<span class="">•</span>
<span class="text-[11px] text-on-surface-variant">Main Quad</span>
</p>
</div>
<div class="text-right shrink-0">
<div class="text-lg font-black text-primary leading-tight">RM 9.00</div>
<span class="text-[10px] text-primary font-bold">Includes Drink</span>
</div>
</div>
<!-- Optimal Pick -->
<div class="bg-surface-container-low rounded-xl p-2.5 flex flex-col gap-1.5">
<div class="flex items-center justify-between gap-1">
<div class="flex items-center gap-1.5 min-w-0">
<span class="font-bold text-xs text-on-surface truncate">Mee Goreng Mamak + Teh O Ais Limau</span>
</div>
</div>
<div class="flex items-center justify-between text-[11px] font-semibold pt-0.5 border-t border-surface-container/60">
<span class="text-secondary flex items-center gap-1 font-semibold">
<span class="w-2 h-2 rounded-full bg-secondary-container"></span>
                🟡 Med queue: ~8 mins wait
              </span>
<span class="text-on-surface-variant text-[10px]">
                ⏱️ 22m total (Shuttle line A)
              </span>
</div>
</div>
<!-- Insight Box -->
<div class="rounded-xl p-2.5 bg-secondary-fixed/30 border border-secondary-fixed/50 text-on-surface flex items-start gap-2">
<span class="text-base shrink-0 leading-none mt-0.5">💡</span>
<p class="text-[11px] leading-snug font-medium text-on-surface">
<strong class="font-bold text-on-secondary-fixed">Gemini Pick:</strong> Covered sheltered pathway available if rain starts. Set includes drink well inside RM15 budget.
            </p>
</div>
<!-- Actions -->
<div class="grid grid-cols-2 gap-2 pt-0.5">
<button class="w-full py-2 px-3 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95">
<span class="material-symbols-outlined text-[15px] text-primary">commute</span>
<span class="">Bus Live Map</span>
</button>
<button class="w-full py-2 px-3 rounded-full bg-primary-container hover:bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95">
<span class="">View Stall</span>
<span class="material-symbols-outlined text-[15px]">arrow_forward</span>
</button>
</div>
</div>
</article>
<!-- CARD 3: The Nest Student Cafe (Match #3, 86% Fit) -->
<article class="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 overflow-hidden flex flex-col transition-all hover:shadow-md">
<!-- Banner Image Placeholder Area -->
<div class="relative w-full h-36 bg-surface-container-low flex flex-col items-center justify-center text-on-surface-variant group cursor-pointer border-b border-surface-container">
<div class="flex flex-col items-center justify-center gap-1 text-center px-4">
<span class="material-symbols-outlined text-3xl text-outline group-hover:scale-110 transition-transform">add_photo_alternate</span>
<span class="text-[11px] font-medium text-on-surface-variant">Food / Stall Photo (Tap to upload)</span>
</div>
<!-- Distance Pill -->
<div class="absolute top-2.5 left-2.5 bg-surface-container-lowest/95 backdrop-blur-md px-2 py-0.5 rounded-full text-on-surface shadow-xs flex items-center gap-1 border border-outline-variant/30">
<span class="material-symbols-outlined text-primary text-[13px]">directions_walk</span>
<span class="text-[10px] font-bold">10-min walk (Library Central)</span>
</div>
<!-- Match #3 Badge -->
<div class="absolute top-2.5 right-2.5 bg-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
            #3 Match • 86% Fit
          </div>
</div>
<!-- Card Content -->
<div class="p-3.5 flex flex-col gap-2.5">
<div class="flex items-start justify-between gap-2">
<div>
<div class="flex items-center gap-1.5">
<h2 class="font-bold text-base text-on-surface leading-tight">The Nest Student Cafe</h2>
</div>
<p class="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
<span class="">Perpustakaan Utama L1</span>
<span class="">•</span>
<span class="text-[11px] text-primary font-semibold">AC Study Zone</span>
</p>
</div>
<div class="text-right shrink-0">
<div class="text-lg font-black text-on-surface leading-tight">RM 14.20</div>
<span class="text-[10px] text-on-surface-variant font-medium">Near Budget Cap</span>
</div>
</div>
<!-- Optimal Pick -->
<div class="bg-surface-container-low rounded-xl p-2.5 flex flex-col gap-1.5">
<div class="flex items-center justify-between gap-1">
<div class="flex items-center gap-1.5 min-w-0">
<span class="font-bold text-xs text-on-surface truncate">Smoked Chicken Rice Bowl &amp; Fruit Tea</span>
</div>
<span class="text-[10px] font-bold text-secondary-container bg-secondary px-1.5 py-0.2 rounded shrink-0">
                Study Spot
              </span>
</div>
<div class="flex items-center justify-between text-[11px] font-semibold pt-0.5 border-t border-surface-container/60">
<span class="text-primary flex items-center gap-1 font-semibold">
<span class="w-2 h-2 rounded-full bg-primary-container"></span>
                🟢 Seated quickly (~5 mins)
              </span>
<span class="text-on-surface-variant text-[10px]">
                ⏱️ 26m total window
              </span>
</div>
</div>
<!-- Insight Box -->
<div class="rounded-xl p-2.5 bg-secondary-fixed/30 border border-secondary-fixed/50 text-on-surface flex items-start gap-2">
<span class="text-base shrink-0 leading-none mt-0.5">💡</span>
<p class="text-[11px] leading-snug font-medium text-on-surface">
<strong class="font-bold text-on-secondary-fixed">Gemini Pick:</strong> Full air-conditioning and plug sockets available before your next 3:00 PM lecture.
            </p>
</div>
<!-- Actions -->
<div class="grid grid-cols-2 gap-2 pt-0.5">
<button class="w-full py-2 px-3 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95">
<span class="material-symbols-outlined text-[15px] text-primary">directions</span>
<span class="">Directions</span>
</button>
<button class="w-full py-2 px-3 rounded-full bg-primary-container hover:bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95">
<span class="">View Cafe</span>
<span class="material-symbols-outlined text-[15px]">arrow_forward</span>
</button>
</div>
</div>
</article>
</main>
<!-- 4. Sticky Mobile Bottom Navigation & Action Bar (GrabFood App Style) -->
<div class="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
<div class="w-full max-w-[390px] bg-surface-container-lowest/95 backdrop-blur-xl border-t border-surface-container-high shadow-lg px-3 pt-2 pb-5 pointer-events-auto flex flex-col gap-2">
<!-- Quick Action Floating Button: Re-roll Optimal Meal -->
<button class="w-full py-2.5 px-4 rounded-full bg-primary-container hover:bg-primary active:scale-[0.98] text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"><span class="material-symbols-outlined text-[18px]">tune</span><span class="">Update Results (2 Filters Changed)</span></button>
<!-- True GrabFood 4-Tab Navigation Bar -->
<nav class="grid items-center pt-1 grid-cols-2" role="navigation">
<!-- Tab 1: Explore (Active) -->
<button class="flex flex-col items-center gap-0.5 text-primary group" type="button">
<span class="material-symbols-outlined text-[22px]">explore</span>
<span class="text-[10px] font-bold tracking-tight">Explore</span>
</button>
<!-- Tab 2: Group Room -->
<button class="flex flex-col items-center gap-0.5 text-on-surface-variant hover:text-on-surface relative group" type="button">
<span class="material-symbols-outlined text-[22px]">groups</span>
<span class="absolute top-0 right-5 w-2 h-2 rounded-full bg-secondary-container"></span>
<span class="text-[10px] font-medium tracking-tight">Group</span>
</button>
<!-- Tab 3: Saved -->
<!-- Tab 4: Orders / History -->
</nav>
</div>
</div>
</div>


</body></html>

