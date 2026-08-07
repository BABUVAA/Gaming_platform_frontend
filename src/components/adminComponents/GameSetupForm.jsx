import { useState } from "react";
import PropTypes from "prop-types";

const GameSetupForm = ({ actions, form, mode, onChange, onSubmit }) => {
  const supportsDirectIntegration = form.link.trim().toLowerCase() === "coc";

  const changeConnectionMethod = (method) => {
    // Changing the verification strategy also clears provider-only settings so
    // an old integration cannot remain hidden inside the submitted payload.
    onChange("accountConnection", {
      ...form.accountConnection,
      integrationKey:
        method === "api_token" && supportsDirectIntegration
          ? "supercell_coc"
          : "none",
      method,
      supportsStatsSync:
        method === "api_token"
          ? form.accountConnection.supportsStatsSync
          : false,
    });
  };

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <FormSection
        description="The stable key is used by player accounts, staff scopes, events, and matches."
        number="01"
        title="Game identity"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Game name"
            onChange={(value) => onChange("name", value)}
            placeholder="Battlegrounds Mobile India"
            required
            value={form.name}
          />
          {mode === "create" ? (
            <TextField
              help="Lowercase letters, numbers, and single hyphens only."
              label="Stable game key"
              onChange={(value) => onChange("link", value.toLowerCase())}
              placeholder="bgmi"
              required
              value={form.link}
            />
          ) : (
            <ReadOnlyField label="Stable game key" value={form.link} />
          )}
        </div>
      </FormSection>

      <FormSection
        description="Modes define how players compete. Maps are optional and can be expanded later."
        number="02"
        title="Competition support"
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <TagEditor
            examples="Solo, Duo, Squad"
            label="Supported modes"
            onChange={(values) => onChange("supportedModes", values)}
            values={form.supportedModes}
          />
          <TagEditor
            examples="Erangel, Miramar, Sanhok"
            label="Supported maps"
            onChange={(values) => onChange("supportedMaps", values)}
            values={form.supportedMaps}
          />
        </div>
      </FormSection>

      <FormSection
        description="Choose how players connect or prove ownership of their in-game account."
        number="03"
        title="Player account connection"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="font-bold text-slate-100">Connection method</span>
            <select
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-cyan-300"
              onChange={(event) => changeConnectionMethod(event.target.value)}
              value={form.accountConnection.method}
            >
              <option value="manual_review">Manual review</option>
              {supportsDirectIntegration && (
                <option value="api_token">Direct game integration</option>
              )}
              <option value="not_supported">No game account connection</option>
            </select>
          </label>

          {form.accountConnection.method === "api_token" && (
            <ReadOnlyField
              label="Integration"
              value="Supercell Clash of Clans"
            />
          )}
        </div>

        {form.accountConnection.method !== "not_supported" && (
          <label className="mt-4 block space-y-2 text-sm text-slate-300">
            <span className="font-bold text-slate-100">
              Player instructions
            </span>
            <textarea
              className="min-h-28 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-cyan-300"
              onChange={(event) =>
                onChange("accountConnection", {
                  ...form.accountConnection,
                  instructions: event.target.value,
                })
              }
              placeholder="Tell players exactly what ID, tag, token, or proof they need to submit."
              value={form.accountConnection.instructions}
            />
          </label>
        )}

        {form.accountConnection.method === "api_token" && (
          <label className="mt-4 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
            <input
              checked={form.accountConnection.supportsStatsSync}
              onChange={(event) =>
                onChange("accountConnection", {
                  ...form.accountConnection,
                  supportsStatsSync: event.target.checked,
                })
              }
              type="checkbox"
            />
            Automatically synchronize supported player statistics
          </label>
        )}
      </FormSection>

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-800 pt-5">
        {actions}
      </div>
    </form>
  );
};

const FormSection = ({ children, description, number, title }) => (
  <section className="rounded-2xl border border-slate-800 bg-slate-950/65 p-5">
    <div className="mb-5 flex items-start gap-4">
      <span className="rounded-lg bg-cyan-300/10 px-2 py-1 text-xs font-black text-cyan-300">
        {number}
      </span>
      <div>
        <h3 className="font-black text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
    </div>
    {children}
  </section>
);

const TextField = ({ help, label, onChange, placeholder, required, value }) => (
  <label className="space-y-2 text-sm text-slate-300">
    <span className="font-bold text-slate-100">{label}</span>
    <input
      className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-cyan-300"
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      required={required}
      value={value}
    />
    {help && <span className="block text-xs text-slate-500">{help}</span>}
  </label>
);

const ReadOnlyField = ({ label, value }) => (
  <div className="space-y-2 text-sm text-slate-300">
    <p className="font-bold text-slate-100">{label}</p>
    <p className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-slate-400">
      {value}
    </p>
  </div>
);

const TagEditor = ({ examples, label, onChange, values }) => {
  const [draft, setDraft] = useState("");

  const addValue = () => {
    const nextValue = draft.trim();
    if (!nextValue) return;

    // Case-insensitive comparison mirrors backend normalization and prevents a
    // user from adding both "Squad" and "squad" in the same form.
    const alreadyExists = values.some(
      (value) => value.toLowerCase() === nextValue.toLowerCase(),
    );
    if (!alreadyExists) onChange([...values, nextValue]);
    setDraft("");
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-bold text-slate-100">{label}</p>
        <p className="mt-1 text-xs text-slate-500">Examples: {examples}</p>
      </div>
      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-cyan-300"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addValue();
            }
          }}
          placeholder="Type and press Enter"
          value={draft}
        />
        <button
          className="rounded-xl border border-slate-700 px-4 text-sm font-bold text-slate-200 hover:border-cyan-300/60"
          onClick={addValue}
          type="button"
        >
          Add
        </button>
      </div>
      <div className="flex min-h-10 flex-wrap gap-2 rounded-xl border border-dashed border-slate-800 p-3">
        {values.map((value) => (
          <button
            className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200 hover:bg-rose-400/15 hover:text-rose-200"
            key={value.toLowerCase()}
            onClick={() => onChange(values.filter((item) => item !== value))}
            title={`Remove ${value}`}
            type="button"
          >
            {value} x
          </button>
        ))}
        {values.length === 0 && (
          <p className="text-xs text-slate-600">Nothing configured yet.</p>
        )}
      </div>
    </div>
  );
};

GameSetupForm.propTypes = {
  actions: PropTypes.node.isRequired,
  form: PropTypes.shape({
    accountConnection: PropTypes.shape({
      instructions: PropTypes.string.isRequired,
      integrationKey: PropTypes.string.isRequired,
      method: PropTypes.string.isRequired,
      supportsStatsSync: PropTypes.bool.isRequired,
    }).isRequired,
    link: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    supportedMaps: PropTypes.arrayOf(PropTypes.string).isRequired,
    supportedModes: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  mode: PropTypes.oneOf(["create", "edit"]).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

FormSection.propTypes = {
  children: PropTypes.node.isRequired,
  description: PropTypes.string.isRequired,
  number: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

TextField.propTypes = {
  help: PropTypes.string,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  value: PropTypes.string.isRequired,
};

ReadOnlyField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

TagEditor.propTypes = {
  examples: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  values: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default GameSetupForm;
