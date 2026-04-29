import useNavigateHook from "../../../hooks/useNavigateHook";

const HeaderLogo = () => {
  const { goToHome } = useNavigateHook();

  return (
    <button
      type="button"
      onClick={goToHome}
      className="flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/8 px-3 py-2 text-left transition hover:border-cyan-300/40 hover:bg-cyan-400/12"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300 text-sm font-black tracking-[0.28em] text-slate-950">
        EG
      </span>
      <span className="hidden sm:block">
        <span className="block text-[11px] uppercase tracking-[0.3em] text-cyan-300/80">
          Real-Time Esports
        </span>
        <span className="block text-sm font-black text-white">E-Gaming</span>
      </span>
    </button>
  );
};

export default HeaderLogo;
