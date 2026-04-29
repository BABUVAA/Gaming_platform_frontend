import { Link } from "react-router-dom";

const AuthShell = ({
  eyebrow,
  title,
  description,
  badges = [],
  asideTitle,
  asideCopy,
  asideStats = [],
  children,
  footer,
}) => {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#020611] text-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-10 px-4 py-8 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-12">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.14),_transparent_28%),linear-gradient(180deg,_rgba(8,15,28,0.96),_rgba(2,6,17,0.98))] p-6 shadow-[0_28px_90px_rgba(2,8,23,0.5)] md:p-10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_42%,rgba(34,211,238,0.06))]" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">
              {eyebrow}
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-black tracking-tight text-white md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 md:text-base">
              {description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200"
                >
                  {badge}
                </span>
              ))}
            </div>

            <div className="mt-10 rounded-[28px] border border-white/10 bg-slate-950/70 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/75">
                    {asideTitle}
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
                    {asideCopy}
                  </p>
                </div>
                <Link
                  to="/home"
                  className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/40 hover:text-cyan-200 md:inline-flex"
                >
                  Platform Preview
                </Link>
              </div>

              {asideStats.length > 0 && (
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {asideStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
                    >
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-base font-bold text-white">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-slate-950/85 p-5 shadow-[0_24px_70px_rgba(2,8,23,0.45)] backdrop-blur md:p-8">
          {children}
          {footer ? (
            <div className="mt-6 border-t border-white/10 pt-5 text-sm text-slate-400">
              {footer}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default AuthShell;
