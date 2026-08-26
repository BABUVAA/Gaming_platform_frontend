import PropTypes from "prop-types";

const StaffWorkspaceTabs = ({ activeId, ariaLabel, items, onChange }) => (
  <nav aria-label={ariaLabel} className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/55 p-1.5">
    {items.map((item) => (
      <button
        aria-current={activeId === item.id ? "page" : undefined}
        className={activeId === item.id
          ? "whitespace-nowrap rounded-lg bg-cyan-300 px-3 py-2 text-sm font-black text-slate-950"
          : "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-slate-400 transition hover:bg-slate-800 hover:text-white"}
        key={item.id}
        onClick={() => onChange(item.id)}
        type="button"
      >
        {item.label}
        {Number.isFinite(item.count) ? <span className="ml-2 opacity-70">{item.count}</span> : null}
      </button>
    ))}
  </nav>
);

StaffWorkspaceTabs.propTypes = {
  activeId: PropTypes.string.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.shape({ count: PropTypes.number, id: PropTypes.string.isRequired, label: PropTypes.string.isRequired })).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default StaffWorkspaceTabs;
