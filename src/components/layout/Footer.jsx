import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { FaDiscord, FaInstagram, FaTrophy, FaYoutube } from "react-icons/fa6";

const Footer = () => {
  return (
    <footer className="border-t border-slate-700 bg-[#182235] text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] md:px-6">
        <div>
          <div className="flex items-center gap-3 text-amber-300">
            <FaTrophy />
            <span className="text-lg font-black text-white">E-Gaming</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
            Play CoC and BGMI tournaments, build your clan, verify your player
            identity, and compete for real rewards.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="rounded-lg bg-amber-300 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-amber-200"
            >
              Join now
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-200 transition hover:border-amber-300/60 hover:text-amber-200"
            >
              Login
            </Link>
          </div>
        </div>

        <FooterColumn
          title="Compete"
          links={[
            { label: "Tournaments", to: "/signup" },
            { label: "Prize wallet", to: "/signup" },
            { label: "Player profile", to: "/signup" },
          ]}
        />

        <FooterColumn
          title="Games"
          links={[
            { label: "Clash of Clans", to: "/coc" },
            { label: "BGMI events", to: "/signup" },
            { label: "Clan squads", to: "/signup" },
          ]}
        />

        <div>
          <h6 className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
            Community
          </h6>
          <div className="mt-4 flex gap-3">
            <a
              href="https://discord.com"
              className="rounded-lg border border-slate-600 p-2 text-slate-400 transition hover:border-amber-300/60 hover:text-amber-200"
              aria-label="Discord"
            >
              <FaDiscord />
            </a>
            <a
              href="https://instagram.com"
              className="rounded-lg border border-slate-600 p-2 text-slate-400 transition hover:border-amber-300/60 hover:text-amber-200"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
            <a
              href="https://youtube.com"
              className="rounded-lg border border-slate-600 p-2 text-slate-400 transition hover:border-amber-300/60 hover:text-amber-200"
              aria-label="YouTube"
            >
              <FaYoutube />
            </a>
          </div>
          <p className="mt-5 text-xs leading-6 text-slate-500">
            Fair play, verified accounts, and reward transparency are core to
            every tournament.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-700 px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>(c) E-Gaming 2026. All rights reserved.</span>
          <span>Built for competitive players and clans.</span>
        </div>
      </div>
    </footer>
  );
};

const FooterColumn = ({ title, links }) => (
  <div>
    <h6 className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
      {title}
    </h6>
    <ul className="mt-4 space-y-3 text-sm">
      {links.map((link) => (
        <li key={link.label}>
          <Link to={link.to} className="text-slate-400 transition hover:text-white">
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

FooterColumn.propTypes = {
  title: PropTypes.string.isRequired,
  links: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default Footer;
