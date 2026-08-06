import { useSelector } from "react-redux";

const GameManagerDashboard = () => {
  const assignment = useSelector((state) =>
    state.player.summary?.staffAssignments?.find(
      (item) => item.role === "game_manager",
    ),
  );

  return (
    <main className="mx-auto max-w-5xl p-6 text-slate-100">
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Game Catalog</p>
      <h1 className="mt-2 text-3xl font-black">Game Manager</h1>
      <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
        <p className="text-sm text-slate-400">You can manage only games assigned by a Platform Admin.</p>
        <p className="mt-4 text-lg font-bold text-white">{assignment?.gameIds?.length || 0} game scope(s) assigned</p>
      </section>
    </main>
  );
};

export default GameManagerDashboard;
