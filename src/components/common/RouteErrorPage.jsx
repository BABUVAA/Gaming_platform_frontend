import { isRouteErrorResponse, useRouteError } from "react-router-dom";

const getRouteErrorMessage = (error) => {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return "We could not find this page.";
  }

  return "This screen could not be opened. Your account data is safe.";
};

/**
 * React Router handles route rendering errors before they reach the provider
 * error boundary. This route-level fallback prevents its developer screen and
 * stack trace from being exposed to players.
 */
const RouteErrorPage = () => {
  const error = useRouteError();

  if (import.meta.env.DEV) {
    console.error("Route rendering failed:", error);
  }

  return (
    <main
      role="alert"
      className="grid min-h-screen place-items-center bg-slate-950 px-6 py-20 text-white"
    >
      <section className="w-full max-w-xl rounded-[28px] border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
          Unable to open page
        </p>
        <h1 className="mt-3 text-3xl font-black">Let&apos;s try that again</h1>
        <p className="mt-3 text-slate-300">{getRouteErrorMessage(error)}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950"
          >
            Reload page
          </button>
          <a
            href="/dashboard"
            className="rounded-xl border border-white/10 px-5 py-3 font-bold text-slate-200"
          >
            Go to dashboard
          </a>
        </div>
      </section>
    </main>
  );
};

export default RouteErrorPage;
