import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios-api";
import {
  FaDiscord,
  FaFacebook,
  FaInstagram,
  FaSteam,
  FaTwitch,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import {
  FiCamera,
  FiCopy,
  FiEdit3,
  FiImage,
  FiSave,
  FiUsers,
} from "react-icons/fi";
import {
  profile_data_update,
  profile_file_update,
  user_profile,
} from "../store/authSlice";

const SOCIAL_PLATFORMS = [
  { key: "discord", label: "Discord", icon: FaDiscord, color: "text-indigo-300" },
  { key: "instagram", label: "Instagram", icon: FaInstagram, color: "text-pink-300" },
  { key: "twitter", label: "X / Twitter", icon: FaTwitter, color: "text-cyan-300" },
  { key: "youtube", label: "YouTube", icon: FaYoutube, color: "text-rose-300" },
  { key: "facebook", label: "Facebook", icon: FaFacebook, color: "text-blue-300" },
  { key: "steam", label: "Steam", icon: FaSteam, color: "text-slate-300" },
  { key: "twitch", label: "Twitch", icon: FaTwitch, color: "text-violet-300" },
];

const Profile = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { profile } = useSelector((store) => store.auth);
  const externalPlayerTag = searchParams.get("playerTag");
  const playerProfile = profile?.profile || {};
  const internalPlayerTag = profile?.profileTag || playerProfile?.profileTag || "";
  const isViewingExternal =
    Boolean(externalPlayerTag) && externalPlayerTag !== internalPlayerTag;
  const [externalPlayer, setExternalPlayer] = useState(null);
  const [externalLoading, setExternalLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [draftSocials, setDraftSocials] = useState(
    playerProfile.linkedAccounts || {}
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadExternalPlayer = async () => {
      if (!isViewingExternal) {
        setExternalPlayer(null);
        return;
      }
      setExternalLoading(true);
      try {
        const response = await api.get(
          `/api/users/public/${encodeURIComponent(externalPlayerTag)}`
        );
        setExternalPlayer(response?.data?.data || null);
      } catch (error) {
        console.error("Unable to load external profile:", error);
        setExternalPlayer(null);
      } finally {
        setExternalLoading(false);
      }
    };

    loadExternalPlayer();
  }, [externalPlayerTag, isViewingExternal]);

  const displayProfile = isViewingExternal ? externalPlayer || {} : playerProfile;
  const linkedGames = useMemo(() => playerProfile.games || [], [playerProfile.games]);
  const tournaments = useMemo(
    () => playerProfile.tournaments || [],
    [playerProfile.tournaments]
  );
  const friendCount = playerProfile.friends?.length || 0;
  const displayLinkedGames = useMemo(
    () => (isViewingExternal ? externalPlayer?.linkedGames || [] : linkedGames),
    [externalPlayer?.linkedGames, isViewingExternal, linkedGames]
  );
  const displaySocials = useMemo(
    () =>
      isViewingExternal
        ? externalPlayer?.linkedAccounts || {}
        : playerProfile.linkedAccounts || {},
    [externalPlayer?.linkedAccounts, isViewingExternal, playerProfile.linkedAccounts]
  );

  const socialLinks = useMemo(
    () => SOCIAL_PLATFORMS.filter(({ key }) => displaySocials?.[key]),
    [displaySocials]
  );

  const stats = [
    {
      label: "Linked Games",
      value: isViewingExternal
        ? externalPlayer?.stats?.linkedGames || 0
        : linkedGames.length || 0,
    },
    {
      label: "Tournaments",
      value: isViewingExternal
        ? externalPlayer?.stats?.tournaments || 0
        : tournaments.length || 0,
    },
    {
      label: "Friends",
      value: isViewingExternal
        ? externalPlayer?.stats?.friends || 0
        : friendCount,
    },
    {
      label: "Bookmarked Clans",
      value: isViewingExternal
        ? externalPlayer?.stats?.bookmarkedClans || 0
        : playerProfile.bookmarkedClans?.length || 0,
    },
  ];

  const openSocialEditor = () => {
    setDraftSocials(playerProfile.linkedAccounts || {});
    setIsSocialModalOpen(true);
  };

  const copyProfileTag = async () => {
    const tagToCopy = isViewingExternal
      ? externalPlayer?.playerTag || externalPlayerTag
      : internalPlayerTag;
    if (!tagToCopy) return;
    try {
      await navigator.clipboard.writeText(tagToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch (error) {
      console.error("Failed to copy profile tag:", error);
    }
  };

  const uploadAsset = async (file) => {
    if (!file || !selectedImageType) return;
    try {
      setIsSaving(true);
      const formPayload = new FormData();
      // The upload thunk sends multipart data, so we construct the payload
      // explicitly instead of relying on axios to infer a File wrapper shape.
      formPayload.append(
        "field",
        selectedImageType === "profile" ? "profile.avatar" : "profile.banner"
      );
      formPayload.append("data", file);
      await dispatch(
        profile_file_update(formPayload)
      ).unwrap();
      await dispatch(user_profile());
      setIsImageModalOpen(false);
    } catch (error) {
      console.error("Profile media update failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveSocialLinks = async () => {
    try {
      setIsSaving(true);
      const payload = Object.fromEntries(
        Object.entries(draftSocials || {}).map(([key, value]) => [key, value || null])
      );
      await dispatch(
        profile_data_update({
          field: "profile.linkedAccounts",
          data: payload,
        })
      ).unwrap();
      await dispatch(user_profile());
      setIsSocialModalOpen(false);
    } catch (error) {
      console.error("Social link update failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {isViewingExternal ? (
        <section className="rounded-[28px] border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          {externalLoading
            ? "Loading player profile preview..."
            : "Viewing external player profile and public stats."}
        </section>
      ) : null}
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/85 shadow-[0_24px_70px_rgba(2,8,23,0.45)]">
        <div
          className="relative h-52 bg-cover bg-center md:h-64"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.25), rgba(2,6,23,0.82)), url(${displayProfile.banner || "/pubg_background.jpg"})`,
          }}
        >
          <button
            type="button"
            disabled={isViewingExternal}
            onClick={() => {
              setSelectedImageType("banner");
              setIsImageModalOpen(true);
            }}
            className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/55 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiImage />
            Update Banner
          </button>
        </div>

        <div className="relative px-5 pb-6 md:px-8">
          <div className="-mt-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="relative">
                <img
                  src={
                    isViewingExternal
                      ? externalPlayer?.avatar || "/profile-pic.png"
                      : playerProfile.avatar || "/profile-pic.png"
                  }
                  alt={
                    isViewingExternal
                      ? externalPlayer?.username || "Player avatar"
                      : playerProfile.username || "Player avatar"
                  }
                  className="h-28 w-28 rounded-[28px] border-4 border-slate-950 object-cover shadow-xl md:h-32 md:w-32"
                />
                <button
                  type="button"
                  disabled={isViewingExternal}
                  onClick={() => {
                    setSelectedImageType("profile");
                    setIsImageModalOpen(true);
                  }}
                  className="absolute -bottom-2 -right-2 rounded-full border border-cyan-300/30 bg-cyan-300 px-3 py-3 text-slate-950 shadow-lg transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiCamera />
                </button>
              </div>

              <div className="pt-2">
                <p className="text-xs uppercase tracking-[0.26em] text-cyan-300/80">
                  Player Identity
                </p>
                <h1 className="mt-2 text-3xl font-black text-white">
                  {isViewingExternal
                    ? externalPlayer?.username || "Player"
                    : playerProfile.username || "Player"}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    {isViewingExternal
                      ? externalPlayerTag || "Player preview"
                      : profile?.email || "No email available"}
                  </span>
                  <button
                    type="button"
                    onClick={copyProfileTag}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-semibold transition hover:border-cyan-300/30 hover:text-cyan-200"
                  >
                    <FiCopy />
                    {(isViewingExternal
                      ? externalPlayer?.playerTag || externalPlayerTag
                      : internalPlayerTag) || "No player tag"}
                    {copied ? " Copied" : ""}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isViewingExternal}
              onClick={openSocialEditor}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiEdit3 />
              Edit Social Links
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5 shadow-[0_18px_40px_rgba(2,8,23,0.35)]"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
                Competition Snapshot
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">Linked game accounts</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
              {displayLinkedGames.length} Connected
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            {displayLinkedGames.length > 0 ? (
              displayLinkedGames.map((game, index) => (
                <div
                  key={`${game.accountId}-${index}`}
                  className="rounded-[24px] border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {game.name || game.game?.name || "Game"}
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-white">
                        {game.accountUsername || game.accountId || "Unspecified account"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {game.accountId || "No account identifier saved"}
                      </p>
                    </div>
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">
                      {game.verificationStatus || "linked"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyPanel
                title="No game accounts linked yet"
                copy="Connect your game identities from the account page to unlock tournament entry and match verification."
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-cyan-300">
                <FiUsers />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
                  Social Reach
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">Linked platforms</h2>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {socialLinks.length > 0 ? (
                socialLinks.map(({ key, label, icon: Icon, color }) => (
                  <a
                    key={key}
                    href={displaySocials[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 transition hover:border-cyan-300/25 hover:bg-black/30"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`text-lg ${color}`} />
                      <span className="font-semibold text-white">{label}</span>
                    </div>
                    <span className="text-sm text-slate-400">Open</span>
                  </a>
                ))
              ) : (
                <EmptyPanel
                  title="No social links added"
                  copy="Add socials to make your profile feel active and easier to recognize in tournaments and clans."
                />
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
              Activity
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">Tournament history</h2>
            <div className="mt-6 grid gap-3">
              {!isViewingExternal && tournaments.length > 0 ? (
                tournaments.slice(0, 5).map((tournament) => (
                  <div
                    key={tournament._id || tournament.tournamentName}
                    className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">
                          {tournament.tournamentName || "Tournament"}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {tournament.game || "Game"}{tournament.mode ? ` - ${tournament.mode}` : ""}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                        {tournament.status || "active"}
                      </span>
                    </div>
                  </div>
                ))
              ) : !isViewingExternal ? (
                <EmptyPanel
                  title="No tournaments joined yet"
                  copy="As you register and play, your recent tournament activity will appear here."
                />
              ) : (
                <EmptyPanel
                  title="External tournament timeline"
                  copy="Detailed external match history can be added as a dedicated API endpoint when needed."
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {isImageModalOpen ? (
        <ModalCard
          title={`Update ${selectedImageType === "profile" ? "profile picture" : "banner image"}`}
          onClose={() => setIsImageModalOpen(false)}
        >
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center text-sm text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-200">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => uploadAsset(event.target.files?.[0])}
            />
            <span className="text-base font-semibold text-white">Choose image</span>
            <span className="mt-2">PNG, JPG, or WEBP work well here.</span>
          </label>
          <button
            type="button"
            onClick={() => setIsImageModalOpen(false)}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Cancel
          </button>
        </ModalCard>
      ) : null}

      {isSocialModalOpen ? (
        <ModalCard title="Edit social links" onClose={() => setIsSocialModalOpen(false)}>
          <div className="grid gap-3">
            {SOCIAL_PLATFORMS.map(({ key, label, icon: Icon, color }) => (
              <label key={key} className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Icon className={color} />
                  {label}
                </span>
                <input
                  value={draftSocials?.[key] || ""}
                  onChange={(event) =>
                    setDraftSocials((prev) => ({
                      ...(prev || {}),
                      [key]: event.target.value,
                    }))
                  }
                  placeholder={`Add your ${label} profile link`}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={saveSocialLinks}
            disabled={isSaving}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            <FiSave />
            Save Links
          </button>
        </ModalCard>
      ) : null}
    </div>
  );
};

const EmptyPanel = ({ title, copy }) => (
  <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-5 py-6">
    <p className="font-semibold text-white">{title}</p>
    <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
  </div>
);

const ModalCard = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
    <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-slate-950 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.55)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-2xl font-black text-white">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          Close
        </button>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  </div>
);

EmptyPanel.propTypes = {
  title: PropTypes.string.isRequired,
  copy: PropTypes.string.isRequired,
};

ModalCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Profile;
