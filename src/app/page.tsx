import SeedDatabaseButton from "@/components/SeedDatabaseButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans">
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-16">
        {/* Header / Intro */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 mb-4">
            🎓 Universiti Malaya Campus Dining
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Student Food Intelligence
          </h1>
          <p className="mt-3 max-w-xl text-base text-zinc-600 dark:text-zinc-400">
            Open-access dining intelligence for UM students. No login or accounts required — discover food courts, faculty canteens, wait times, prices, and halal options instantly.
          </p>
        </div>

        {/* Feature Badges */}
        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4 w-full max-w-2xl text-center">
          <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="block text-xl">🔓</span>
            <span className="text-xs font-medium">100% Login-Free</span>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="block text-xl">🇲🇾</span>
            <span className="text-xs font-medium">RM5 – RM20 Meals</span>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="block text-xl">⚡</span>
            <span className="text-xs font-medium">Prep Times & Menus</span>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="block text-xl">✅</span>
            <span className="text-xs font-medium">Halal & Dietary Tags</span>
          </div>
        </div>

        {/* Admin Seeder Component */}
        <SeedDatabaseButton />

        {/* Footer Note */}
        <p className="mt-12 text-xs text-zinc-400 text-center">
          Phase 1 Initialized with Next.js (App Router), Tailwind CSS & Cloud Firestore.
        </p>
      </main>
    </div>
  );
}
