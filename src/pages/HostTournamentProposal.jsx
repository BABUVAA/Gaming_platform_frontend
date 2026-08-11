import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { FiArrowLeft, FiSend } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ROUTES } from "../routes/routeConstants";
import { selectGames } from "../store/selectors/gameSelectors";
import {
  selectHostProposal,
  selectHostProposalError,
  selectHostProposalStatus,
} from "../store/selectors/hostQuickMatchProposalSelectors";
import { proposeHostQuickMatchDraft } from "../store/slices/hostQuickMatchProposalSlice";
import { useCatalogStore } from "../store/useStore";

const initialForm = {
  entryFee: "0",
  entryPolicy: "free",
  gameId: "",
  map: "",
  maxParticipants: "10",
  mode: "",
  prizePool: "0",
  region: "india",
  schedulePolicy: "on_demand",
  teamSize: "1",
  title: "",
};

const toMinorUnits = (value) => Math.round(Number(value || 0) * 100);

const HostTournamentProposal = () => {
  const dispatch = useDispatch();
  const games = useSelector(selectGames);
  const status = useSelector(selectHostProposalStatus);
  const error = useSelector(selectHostProposalError);
  const proposal = useSelector(selectHostProposal);
  const { loadGames } = useCatalogStore();
  const [form, setForm] = useState(initialForm);
  const [validationError, setValidationError] = useState("");
  const selectedGame = useMemo(
    () => games.find((game) => game._id === form.gameId),
    [form.gameId, games],
  );

  useEffect(() => {
    loadGames().catch(() => undefined);
  }, [loadGames]);

  const update = (field, value) => {
    setValidationError("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  const chooseGame = (gameId) => {
    const game = games.find((item) => item._id === gameId);
    setValidationError("");
    setForm((current) => ({
      ...current,
      gameId,
      map: "",
      mode: game?.supportedModes?.[0] || "",
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const teamSize = Number(form.teamSize);
    const maxParticipants = Number(form.maxParticipants);
    if (maxParticipants % teamSize !== 0) {
      setValidationError("Seats must fit complete teams.");
      return;
    }

    await dispatch(
      proposeHostQuickMatchDraft({
        currency: "INR",
        entryFeeMinor:
          form.entryPolicy === "free" ? 0 : toMinorUnits(form.entryFee),
        entryPolicy: form.entryPolicy,
        gameId: form.gameId,
        map: form.map || null,
        maxParticipants,
        mode: form.mode,
        operatorCoverageRequired: true,
        prizePoolMinor: toMinorUnits(form.prizePool),
        region: form.region,
        schedulePolicy: form.schedulePolicy,
        teamSize,
        title: form.title.trim(),
      }),
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white" to={ROUTES.TOURNAMENT}>
        <FiArrowLeft /> Back to tournaments
      </Link>

      <section className="rounded-[30px] border border-slate-700 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.12),_transparent_35%),#07111f] p-6 md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Approved host</p>
        <h1 className="mt-2 text-3xl font-black text-white">Propose a tournament</h1>
        <p className="mt-2 text-sm text-slate-400">Submit a draft for platform review. Publishing remains with Platform Admin.</p>
      </section>

      <section className="rounded-[30px] border border-slate-800 bg-slate-950/80 p-5 md:p-7">
        {proposal ? (
          <div className="mb-5 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            <strong>{proposal.title}</strong> was submitted as a draft.
          </div>
        ) : null}
        {(validationError || error) ? (
          <p className="mb-5 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100">{validationError || error}</p>
        ) : null}

        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <Field label="Title">
            <input required value={form.title} onChange={(event) => update("title", event.target.value)} {...inputProps} />
          </Field>
          <Field label="Game">
            <select required value={form.gameId} onChange={(event) => chooseGame(event.target.value)} {...inputProps}>
              <option value="">Choose game</option>
              {games.map((game) => <option key={game._id} value={game._id}>{game.name}</option>)}
            </select>
          </Field>
          <Field label="Mode">
            <select required disabled={!selectedGame} value={form.mode} onChange={(event) => update("mode", event.target.value)} {...inputProps}>
              <option value="">Choose mode</option>
              {(selectedGame?.supportedModes || []).map((mode) => <option key={mode} value={mode}>{mode}</option>)}
            </select>
          </Field>
          <Field label="Map">
            <select disabled={!selectedGame} value={form.map} onChange={(event) => update("map", event.target.value)} {...inputProps}>
              <option value="">No map</option>
              {(selectedGame?.supportedMaps || []).map((map) => <option key={map} value={map}>{map}</option>)}
            </select>
          </Field>
          <Field label="Players per team">
            <input min="1" max="100" required type="number" value={form.teamSize} onChange={(event) => update("teamSize", event.target.value)} {...inputProps} />
          </Field>
          <Field label="Total seats">
            <input min="2" max="1000" required type="number" value={form.maxParticipants} onChange={(event) => update("maxParticipants", event.target.value)} {...inputProps} />
          </Field>
          <Field label="Entry">
            <select value={form.entryPolicy} onChange={(event) => update("entryPolicy", event.target.value)} {...inputProps}>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </Field>
          <Field label="Entry fee (INR)">
            <input disabled={form.entryPolicy === "free"} min="0" required step="0.01" type="number" value={form.entryFee} onChange={(event) => update("entryFee", event.target.value)} {...inputProps} />
          </Field>
          <Field label="Prize pool (INR)">
            <input min="0" required step="0.01" type="number" value={form.prizePool} onChange={(event) => update("prizePool", event.target.value)} {...inputProps} />
          </Field>
          <Field label="Region">
            <input maxLength="40" required value={form.region} onChange={(event) => update("region", event.target.value)} {...inputProps} />
          </Field>
          <Field label="Start rule">
            <select value={form.schedulePolicy} onChange={(event) => update("schedulePolicy", event.target.value)} {...inputProps}>
              <option value="on_demand">When seats fill</option>
              <option value="scheduled">Scheduled by platform</option>
            </select>
          </Field>
          <div className="flex items-end md:justify-end">
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 disabled:cursor-wait disabled:opacity-60 md:w-auto" disabled={status === "loading"} type="submit">
              <FiSend /> {status === "loading" ? "Submitting..." : "Submit draft"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

const inputProps = {
  className: "w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400 disabled:opacity-50",
};

const Field = ({ children, label }) => (
  <label className="space-y-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
    <span>{label}</span>
    {children}
  </label>
);

Field.propTypes = { children: PropTypes.node.isRequired, label: PropTypes.string.isRequired };

export default HostTournamentProposal;
