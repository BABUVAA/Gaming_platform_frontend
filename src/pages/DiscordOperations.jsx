import { useEffect } from "react";
import { FiCheckCircle, FiExternalLink, FiLink, FiRefreshCw } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { connectDiscord, fetchDiscordConnection, syncDiscordRoles } from "../store/slices/discordOperationsSlice.js";

const DiscordOperations = () => {
  const dispatch = useDispatch();
  const discord = useSelector((state) => state.discordOperations);

  useEffect(() => {
    const request = dispatch(fetchDiscordConnection());
    return () => request.abort();
  }, [dispatch]);

  const connect = async () => {
    const result = await dispatch(connectDiscord());
    if (connectDiscord.fulfilled.match(result) && result.payload?.authorizationUrl) window.location.assign(result.payload.authorizationUrl);
  };

  const connection = discord.connection;
  const isConnected = connection.connected;

  return (
    <main className="mx-auto max-w-5xl space-y-5 text-slate-100">
      <section className="rounded-3xl border border-cyan-300/15 bg-slate-950/35 p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Discord</p>
        <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">Staff community</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Connect once to join the server and receive roles from your active workspaces.</p>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5 sm:p-6">
        {discord.status === "loading" && !discord.loaded ? (
          <div className="h-20 animate-pulse rounded-2xl bg-slate-800" aria-label="Loading Discord connection" />
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isConnected ? "bg-emerald-400/10 text-emerald-300" : "bg-indigo-400/10 text-indigo-300"}`}>
                {isConnected ? <FiCheckCircle /> : <FiLink />}
              </span>
              <div className="min-w-0">
                <p className="font-black text-white">{isConnected ? connection.discordUsername : "Discord not connected"}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {connection.status === "sync_failed" ? "Connected · role sync needs attention" : isConnected ? `${connection.syncedRoles} active role${connection.syncedRoles === 1 ? "" : "s"} synced` : discord.configured ? "Join EGAMING and sync your staff roles" : "Discord OAuth configuration is pending"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {isConnected ? (
                <button className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3.5 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-50" disabled={discord.actionStatus === "loading"} onClick={() => dispatch(syncDiscordRoles())} type="button"><FiRefreshCw /> Sync roles</button>
              ) : (
                <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-400 px-3.5 py-2.5 text-sm font-black text-slate-950 disabled:opacity-50" disabled={!discord.configured || discord.actionStatus === "loading"} onClick={connect} type="button"><FiLink /> Connect Discord</button>
              )}
              <a className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3.5 py-2.5 text-sm font-black text-cyan-200" href={discord.serverUrl || "https://discord.com/app"} rel="noreferrer" target="_blank">Open Discord <FiExternalLink /></a>
            </div>
          </div>
        )}
        {discord.error ? <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{discord.error}</p> : null}
      </section>
    </main>
  );
};

export default DiscordOperations;
