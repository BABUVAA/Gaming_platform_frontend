import PropTypes from "prop-types";

const StaffWorkspaceHeader = ({ actions, description, title }) => (
  <header className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4 sm:px-5">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  </header>
);

StaffWorkspaceHeader.propTypes = {
  actions: PropTypes.node,
  description: PropTypes.string,
  title: PropTypes.string.isRequired,
};

export default StaffWorkspaceHeader;
