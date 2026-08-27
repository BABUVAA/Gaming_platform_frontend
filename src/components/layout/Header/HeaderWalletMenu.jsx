import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { CiWallet } from "react-icons/ci";
import { TbCoinRupeeFilled } from "react-icons/tb";

const formatAvailableBalance = (wallet) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: wallet?.currency || "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format((Number(wallet?.availableMinor) || 0) / 100);

const HeaderWalletMenu = () => {
  const { wallet } = useSelector((store) => store.payment);

  return (
    <Link
      to="/dashboard/wallet"
      className="inline-flex items-center gap-3 rounded-2xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 transition hover:border-cyan-400/50 hover:bg-slate-700"
    >
      <div className="rounded-xl bg-cyan-400/15 p-2 text-cyan-300">
        <CiWallet className="text-lg" />
      </div>
      <div className="hidden text-left xl:block">
        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
          Wallet
        </p>
        <div className="mt-1 flex items-center gap-3 text-sm font-semibold">
          <span className="inline-flex items-center gap-1 text-emerald-300">
            <TbCoinRupeeFilled size={15} />
            {formatAvailableBalance(wallet)}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default HeaderWalletMenu;
