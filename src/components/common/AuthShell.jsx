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
    <div className="min-h-[calc(100vh-5rem)] bg-[#111827] text-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-10 px-4 py-8 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-12">
        <section className="relative overflow-hidden rounded-[32px] border border-slate-600 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.10),transparent_28%),linear-gradient(180deg,#253247,#1e293b)] p-6 shadow-[0_28px_70px_rgba(2,8,23,0.24)] md:p-10">
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

        <section className="rounded-[32px] border border-slate-600 bg-slate-800/95 p-5 shadow-[0_24px_70px_rgba(2,8,23,0.24)] backdrop-blur md:p-8">
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
