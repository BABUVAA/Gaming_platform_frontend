import { Link } from "react-router-dom";
import PropTypes from "prop-types";

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
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_36%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.10),transparent_34%),#111827] text-slate-100 md:min-h-[calc(100vh-5rem)]">
      <div className="pointer-events-none absolute inset-x-6 top-12 h-48 rounded-full bg-cyan-300/5 blur-3xl lg:hidden" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-end gap-10 px-0 py-0 sm:items-center sm:px-4 sm:py-8 md:min-h-[calc(100vh-5rem)] md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-12">
        <section className="relative hidden overflow-hidden rounded-[32px] border border-slate-600 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.10),transparent_28%),linear-gradient(180deg,#253247,#1e293b)] p-6 shadow-[0_28px_70px_rgba(2,8,23,0.24)] md:p-10 lg:block">
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.32em] text-amber-300">
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
                  className="rounded-full border border-slate-600 bg-slate-700/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200"
                >
                  {badge}
                </span>
              ))}
            </div>

            <div className="mt-10 rounded-[28px] border border-slate-600 bg-slate-800/70 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-amber-300">
                    {asideTitle}
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
                    {asideCopy}
                  </p>
                </div>
                <Link
                  to="/home"
                  className="hidden rounded-full border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-amber-300/60 hover:text-amber-200 md:inline-flex"
                >
                  Preview
                </Link>
              </div>

              {asideStats.length > 0 && (
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {asideStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-slate-600 bg-slate-700 px-4 py-4"
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

        <section className="mx-auto max-h-[calc(100vh-4rem)] w-full max-w-xl overflow-y-auto rounded-t-[28px] border border-b-0 border-slate-600 bg-slate-800/95 p-5 shadow-[0_-24px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl sm:max-h-none sm:rounded-[28px] sm:border-b sm:p-7 sm:shadow-[0_24px_70px_rgba(2,8,23,0.38)] lg:max-w-none lg:rounded-[32px] lg:p-8">
          <div
            aria-hidden="true"
            className="mx-auto mb-4 h-1 w-12 rounded-full bg-slate-500 sm:hidden"
          />
          {children}
          {footer ? (
            <div className="mt-6 border-t border-slate-700 pt-5 text-sm text-slate-400">
              {footer}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};

AuthShell.propTypes = {
  eyebrow: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  badges: PropTypes.arrayOf(PropTypes.string),
  asideTitle: PropTypes.string.isRequired,
  asideCopy: PropTypes.string.isRequired,
  asideStats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }),
  ),
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
};

export default AuthShell;
