import { useState } from "react";
import { useDispatch } from "react-redux";
import { createCatalogGame } from "../../store/slices/adminSlice";

const INITIAL_FORM = {
  background: "",
  character: "",
  div_color: "#0f172a",
  id: "",
  link: "",
  name: "",
  status: "draft",
  supportedMaps: "",
  supportedModes: "",
  title: "",
};

const GameCatalog = () => {
  const dispatch = useDispatch();
  const [form, setForm] = useState(INITIAL_FORM);

  const updateField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const createGame = async (event) => {
    event.preventDefault();
    // Comma-separated text is converted at the UI edge so the API always
    // receives real arrays for reusable competition configuration.
    await dispatch(
      createCatalogGame({
        ...form,
        supportedMaps: form.supportedMaps.split(",").map((value) => value.trim()).filter(Boolean),
        supportedModes: form.supportedModes.split(",").map((value) => value.trim()).filter(Boolean),
      }),
    ).unwrap();
    setForm(INITIAL_FORM);
  };

  const textFields = ["id", "link", "name", "background", "character", "title", "div_color"];

  return (
    <section className="rounded-[28px] border border-slate-800 bg-slate-950/90 p-6">
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/75">Game Setup</p>
      <h2 className="mt-2 text-2xl font-black text-white">Game Catalog</h2>
      <form className="mt-6 grid gap-3 md:grid-cols-2" onSubmit={createGame}>
        {textFields.map((field) => (
          <input
            className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white"
            key={field}
            onChange={(event) => updateField(field, event.target.value)}
            placeholder={field.replaceAll("_", " ")}
            required
            value={form[field]}
          />
        ))}
        <input
          className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white"
          onChange={(event) => updateField("supportedModes", event.target.value)}
          placeholder="supported modes, separated by commas"
          value={form.supportedModes}
        />
        <input
          className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white"
          onChange={(event) => updateField("supportedMaps", event.target.value)}
          placeholder="supported maps, separated by commas"
          value={form.supportedMaps}
        />
        <select
          className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white"
          onChange={(event) => updateField("status", event.target.value)}
          value={form.status}
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <button className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950">
          Create game
        </button>
      </form>
    </section>
  );
};

export default GameCatalog;
