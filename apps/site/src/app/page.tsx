import { Eye, Landmark, Layers, Percent, ShieldCheck, Timer } from "lucide-react";
import { Logo } from "@/components/logo";
import { MiniAppButton } from "@/components/miniapp-button";
import { Phone } from "@/components/phone";

const steps = [
  { title: "Create a vault", body: "Name your goal, like school fees or a new phone, and choose how much to save." },
  { title: "Pick a date", body: "Lock it for a week, a month, or a year. Your savings stay put until then." },
  { title: "Get it back", body: "When the day comes, withdraw to your MiniPay wallet in one tap." },
];

const features = [
  { icon: Timer, title: "Live countdown", body: "See exactly how long until each vault unlocks." },
  { icon: Layers, title: "Several goals at once", body: "Keep separate vaults, each with its own date." },
  { icon: Eye, title: "Hide your balance", body: "Mask your amounts with one tap when others are around." },
];

const promises = [
  {
    icon: ShieldCheck,
    title: "No early withdrawals",
    body: "Once it's locked, nobody can move it before your date. Not you, and not us.",
  },
  {
    icon: Landmark,
    title: "Your money stays on Celo",
    body: "Savings are held by a smart contract on the Celo blockchain, never by PiggyLock.",
  },
  {
    icon: Percent,
    title: "One small fee",
    body: "0.25% when you withdraw. It's shown before you confirm and can never change.",
  },
];

const faqs = [
  {
    q: "What if I need my money early?",
    a: "You can't take it out early. That's the point: it keeps your savings safe from impulse spending. Only lock what you won't need before the date.",
  },
  {
    q: "What does it cost?",
    a: "0.25% of your savings when you withdraw. Lock 100 USDT and you get 99.75 USDT back. MiniPay's usual small network fee applies to each transaction.",
  },
  {
    q: "Which money can I save?",
    a: "Digital dollars from your MiniPay wallet. PiggyLock launches with USDT, and your savings go straight back to your MiniPay wallet when you withdraw.",
  },
  {
    q: "Is PiggyLock available now?",
    a: "PiggyLock is currently being tested on Celo's test network and hasn't been audited yet. It's coming to MiniPay soon.",
  },
];

export default function Home() {
  return (
    <>
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#how-it-works" className="hover:text-foreground">How it works</a>
          <a href="#faq" className="hidden hover:text-foreground sm:inline">FAQ</a>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-10 pb-20 md:grid-cols-2 md:pt-16">
          <div>
            <h1 className="text-5xl leading-[1.04] text-balance sm:text-6xl md:text-7xl">
              Savings you can&apos;t touch early.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-pretty text-muted-foreground">
              Pick an amount and a date. Your money stays locked until then.
            </p>
            <div className="mt-8">
              <MiniAppButton />
            </div>
          </div>
          <div className="flex justify-center md:justify-end md:pr-6">
            <Phone screen="home" alt="PiggyLock home screen showing 550 USDT locked across three savings vaults" />
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-8 border-y bg-card">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="text-4xl sm:text-5xl">How it works</h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-3">
              {steps.map((step, i) => (
                <li key={step.title}>
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Countdown showcase */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2">
          <div className="order-2 flex justify-center md:order-1 md:justify-start">
            <Phone screen="vault" alt="A PiggyLock vault for school fees, unlocking in 23 days" />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-4xl sm:text-5xl">
              Watch your goal get closer.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Every vault shows what you&apos;ve saved and how long is left, down to the second.
            </p>
            <ul className="mt-8 flex flex-col gap-6">
              {features.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-1 text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Promises */}
        <section className="border-y bg-card">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="max-w-xl text-4xl sm:text-5xl">
              Nobody can touch it early. Not even us.
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {promises.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-xl border bg-background p-6">
                  <Icon className="size-6 text-primary" />
                  <h3 className="mt-4 text-lg font-bold">{title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-8 px-5 py-20">
          <h2 className="text-4xl sm:text-5xl">Questions</h2>
          <div className="mt-8 divide-y border-y">
            {faqs.map(({ q, a }) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden className="text-2xl leading-none text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final call to action */}
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-hero-from to-hero-to px-6 py-14 text-center text-white sm:px-12">
            <div aria-hidden className="absolute -top-16 -right-12 size-56 rounded-full bg-white/10" />
            <div aria-hidden className="absolute -bottom-20 -left-10 size-48 rounded-full bg-white/5" />
            <h2 className="relative text-4xl sm:text-5xl">
              Start your first vault.
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-lg text-white/85">
              Set a goal, pick a date, and let your savings wait for you.
            </p>
            <div className="relative mt-8 flex justify-center">
              <MiniAppButton inverted />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p>Built for MiniPay on Celo. Not affiliated with Opera or MiniPay.</p>
          <p>© {new Date().getFullYear()} PiggyLock</p>
        </div>
      </footer>
    </>
  );
}
