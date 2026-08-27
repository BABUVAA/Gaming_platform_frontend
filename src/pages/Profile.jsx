import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
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
} from "react-icons/fi";
import {
  fetchPublicPlayerProfile,
  fetchPlayerProfile,
  playerActions,
  updatePlayerProfileData,
  updatePlayerProfileFile,
} from "../store/slices/playerSlice";
import {
  selectIsStaffUtilityMode,
  selectPublicPlayerProfile,
  selectPublicPlayerProfileStatus,
} from "../store/selectors/playerSelectors";
import { STAFF_UTILITY_MESSAGE } from "../utils/staffUtilityMode";

const SOCIAL_PLATFORMS = [
  { key: "discord", label: "Discord", icon: FaDiscord, color: "text-indigo-300" },
  { key: "instagram", label: "Instagram", icon: FaInstagram, color: "text-pink-300" },
  { key: "twitter", label: "X / Twitter", icon: FaTwitter, color: "text-cyan-300" },
  { key: "youtube", label: "YouTube", icon: FaYoutube, color: "text-rose-300" },
  { key: "facebook", label: "Facebook", icon: FaFacebook, color: "text-blue-300" },
  { key: "steam", label: "Steam", icon: FaSteam, color: "text-slate-300" },
  { key: "twitch", label: "Twitch", icon: FaTwitch, color: "text-violet-300" },
];

const safeSocialHref = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
};

const Profile = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { error: profileError, profile, profileStatus } = useSelector(
    (store) => store.player,
  );
  const isStaffUtilityMode = useSelector(selectIsStaffUtilityMode);
  const externalPlayer = useSelector(selectPublicPlayerProfile);
  const externalStatus = useSelector(selectPublicPlayerProfileStatus);
  const externalPlayerTag = searchParams.get("playerTag");
  const playerProfile = profile?.profile || {};
  const internalPlayerTag = profile?.profileTag || playerProfile?.profileTag || "";
  const isViewingExternal =
    Boolean(externalPlayerTag) && externalPlayerTag !== internalPlayerTag;
  const [copied, setCopied] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [draftSocials, setDraftSocials] = useState(
    playerProfile.linkedAccounts || {}
  );
  const [draftBio, setDraftBio] = useState(playerProfile.bio || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isViewingExternal) {
      dispatch(fetchPublicPlayerProfile(externalPlayerTag));
    } else {
      dispatch(playerActions.clearPublicProfile());
    }

    return () => {
      dispatch(playerActions.clearPublicProfile());
    };
  }, [dispatch, externalPlayerTag, isViewingExternal]);

  const publicIdentity = externalPlayer?.identity || {};
  const displayProfile = isViewingExternal ? publicIdentity : playerProfile;
  const linkedGames = useMemo(() => playerProfile.games || [], [playerProfile.games]);
  const displayLinkedGames = useMemo(
    () => (isViewingExternal ? externalPlayer?.verifiedGames || [] : linkedGames),
    [externalPlayer?.verifiedGames, isViewingExternal, linkedGames]
  );
  const displaySocials = useMemo(
    () =>
      isViewingExternal
        ? externalPlayer?.linkedAccounts || {}
        : playerProfile.linkedAccounts || {},
    [externalPlayer?.linkedAccounts, isViewingExternal, playerProfile.linkedAccounts]
  );

  const socialLinks = useMemo(
    () =>
      SOCIAL_PLATFORMS.map((platform) => ({
        ...platform,
        href: safeSocialHref(displaySocials?.[platform.key]),
      })).filter(({ href }) => href),
    [displaySocials]
  );

  useEffect(() => {
    if (
      externalPlayerTag ||
      profile ||
      profileStatus === "loading" ||
      profileStatus === "failed"
    ) {
      return;
    }
    dispatch(fetchPlayerProfile());
  }, [dispatch, externalPlayerTag, profile, profileStatus]);

  if (!externalPlayerTag && !profile) {
    return (
      <section className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-slate-950/85 p-5 text-center">
        {profileStatus === "failed" ? (
          <>
            <h1 className="text-xl font-black text-white">Profile unavailable</h1>
            <p className="mt-2 text-sm text-slate-400">
              {profileError?.message || "Unable to load your player profile."}
            </p>
            <button
              type="button"
              onClick={() => dispatch(fetchPlayerProfile())}
              className="mt-4 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950"
            >
              Retry
            </button>
          </>
        ) : (
          <p className="text-sm font-semibold text-slate-300">Loading profile...</p>
        )}
      </section>
    );
  }

  const openSocialEditor = () => {
    if (isStaffUtilityMode) return;
    setDraftSocials(playerProfile.linkedAccounts || {});
    setDraftBio(playerProfile.bio || "");
    setIsSocialModalOpen(true);
  };

  const copyProfileTag = async () => {
    const tagToCopy = isViewingExternal
      ? publicIdentity?.playerTag || externalPlayerTag
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
    if (!file || !selectedImageType || isStaffUtilityMode) return;
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
        updatePlayerProfileFile(formPayload)
      ).unwrap();
      await dispatch(fetchPlayerProfile());
      setIsImageModalOpen(false);
    } catch (error) {
      console.error("Profile media update failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveSocialLinks = async () => {
    if (isStaffUtilityMode) return;
    try {
      setIsSaving(true);
      const payload = Object.fromEntries(
        Object.entries(draftSocials || {}).map(([key, value]) => [key, value || null])
      );
      if (draftBio.trim() !== (playerProfile.bio || "")) {
        await dispatch(
          updatePlayerProfileData({
            field: "profile.bio",
            data: draftBio.trim(),
          })
        ).unwrap();
      }
      await dispatch(
        updatePlayerProfileData({
          field: "profile.linkedAccounts",
          data: payload,
        })
      ).unwrap();
      await dispatch(fetchPlayerProfile());
      setIsSocialModalOpen(false);
    } catch (error) {
      console.error("Social link update failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {isViewingExternal ? (
        <section className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {externalStatus === "loading"
            ? "Loading player profile..."
            : externalStatus === "failed"
              ? "This player profile is unavailable."
              : "Player profile"}
        </section>
      ) : null}
      {isStaffUtilityMode ? (
        <section className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {STAFF_UTILITY_MESSAGE}
        </section>
      ) : null}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/85">
        <div
          className="relative h-28 bg-cover bg-center md:h-36"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.25), rgba(2,6,23,0.82)), url(${displayProfile.banner || "/pubg_background.jpg"})`,
          }}
        >
          {!isViewingExternal && !isStaffUtilityMode ? (
            <button
              type="button"
              onClick={() => {
                setSelectedImageType("banner");
                setIsImageModalOpen(true);
              }}
              aria-label="Update banner"
              className="absolute right-3 top-3 rounded-lg border border-white/10 bg-black/55 p-2.5 text-white transition hover:bg-black/70"
            >
              <FiImage />
            </button>
          ) : null}
        </div>

        <div className="relative px-4 pb-4 sm:px-5">
          <div className="-mt-9 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-3">
              <div className="relative">
                <img
                  src={
                    isViewingExternal
                      ? publicIdentity?.avatar || "/profile-pic.png"
                      : playerProfile.avatar || "/profile-pic.png"
                  }
                  alt={
                    isViewingExternal
                      ? publicIdentity?.username || "Player avatar"
                      : playerProfile.username || "Player avatar"
                  }
                  className="h-20 w-20 rounded-2xl border-4 border-slate-950 object-cover shadow-xl md:h-24 md:w-24"
                />
                {!isViewingExternal && !isStaffUtilityMode ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImageType("profile");
                      setIsImageModalOpen(true);
                    }}
                    aria-label="Update profile picture"
                    className="absolute -bottom-1 -right-1 rounded-full border border-cyan-300/30 bg-cyan-300 p-2 text-slate-950 shadow-lg transition hover:bg-cyan-200"
                  >
                    <FiCamera />
                  </button>
                ) : null}
              </div>

              <div className="min-w-0 pb-1">
                <h1 className="truncate text-xl font-black text-white sm:text-2xl">
                  {isViewingExternal
                    ? publicIdentity?.username || "Player"
                    : playerProfile.username || "Player"}
                </h1>
                <button
                  type="button"
                  onClick={copyProfileTag}
                  className="mt-1 inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-cyan-200"
                >
                  <FiCopy />
                  <span className="truncate">
                    {(isViewingExternal
                      ? publicIdentity?.playerTag || externalPlayerTag
                      : internalPlayerTag) || "No player tag"}
                  </span>
                  {copied ? <span className="text-cyan-200">Copied</span> : null}
                </button>
              </div>
            </div>

            {!isViewingExternal && !isStaffUtilityMode ? (
              <button
                type="button"
                onClick={openSocialEditor}
                className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400/15 sm:self-auto"
              >
                <FiEdit3 />
                Edit profile
              </button>
            ) : null}
          </div>
          {displayProfile.bio ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              {displayProfile.bio}
            </p>
          ) : !isViewingExternal && !isStaffUtilityMode ? (
            <button
              type="button"
              onClick={openSocialEditor}
              className="mt-3 text-sm text-slate-500 transition hover:text-cyan-200"
            >
              Add a short bio
            </button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-black text-white">Game accounts</h2>
            {isViewingExternal ? null : <span className="text-xs font-semibold text-slate-500">{displayLinkedGames.length} linked</span>}
          </div>

          <div className="mt-3 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
            {displayLinkedGames.length > 0 ? (
              displayLinkedGames.map((game, index) => (
                <div
                  key={`${game.game?.id || game.game?._id || game.accountUsername}-${index}`}
                  className="flex items-center justify-between gap-3 bg-black/20 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">
                      {game.game?.name || game.name || "Game"}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {game.accountUsername || (isViewingExternal ? "Verified account" : game.accountId) || "Account linked"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold capitalize text-cyan-200">
                    {game.verificationStatus || "linked"}
                  </span>
                </div>
              ))
            ) : (
              <EmptyPanel title="No game accounts linked" />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-black text-white">Social links</h2>
            {!isViewingExternal && !isStaffUtilityMode ? (
              <button
                type="button"
                onClick={openSocialEditor}
                className="text-xs font-bold text-cyan-200 transition hover:text-cyan-100"
              >
                Edit
              </button>
            ) : null}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {socialLinks.length > 0 ? (
              socialLinks.map(({ key, label, icon: Icon, color, href }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 transition hover:border-cyan-300/25 hover:bg-black/30"
                >
                  <Icon className={`shrink-0 text-lg ${color}`} />
                  <span className="truncate text-sm font-semibold text-white">{label}</span>
                </a>
              ))
            ) : (
              <EmptyPanel title="No social links added" />
            )}
          </div>
        </div>
      </section>

      {isViewingExternal && externalStatus === "succeeded" ? (
        <>
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <WorthStat label="Played" value={externalPlayer?.worth?.competitionsCompleted || 0} />
            <WorthStat label="Wins" value={externalPlayer?.worth?.wins || 0} />
            <WorthStat label="Podiums" value={externalPlayer?.worth?.podiums || 0} />
            <WorthStat label="Best" value={externalPlayer?.worth?.bestPlacement ? `#${externalPlayer.worth.bestPlacement}` : "-"} />
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-black text-white">Recent competition</h2>
                <span className="text-xs text-slate-500">{externalPlayer?.worth?.eventsCompleted || 0} Events · {externalPlayer?.worth?.quickMatchesCompleted || 0} Quick Matches</span>
              </div>
              <div className="mt-3 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
                {(externalPlayer?.recentHistory || []).length ? externalPlayer.recentHistory.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-3 bg-black/20 px-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{item.title || (item.type === "event" ? "Event" : "Quick Match")}</p>
                      <p className="truncate text-xs capitalize text-slate-500">{item.type === "quick_match" ? "Quick Match" : "Event"}{item.mode ? ` · ${item.mode}` : ""}</p>
                    </div>
                    <span className="shrink-0 text-sm font-black text-cyan-200">{item.placement ? `#${item.placement}` : "-"}</span>
                  </div>
                )) : <EmptyPanel title="No completed competition yet" />}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
              <h2 className="text-base font-black text-white">Clan</h2>
              {externalPlayer?.clan ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="font-bold text-white">{externalPlayer.clan.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{externalPlayer.clan.tag} · {externalPlayer.clan.members} members</p>
                  {externalPlayer.clan.league ? <p className="mt-2 text-xs font-semibold text-cyan-200">{externalPlayer.clan.league}</p> : null}
                </div>
              ) : <div className="mt-3"><EmptyPanel title="No clan" /></div>}
            </div>
          </section>
        </>
      ) : null}

      {isImageModalOpen && !isStaffUtilityMode ? (
        <ModalCard
          title={`Update ${selectedImageType === "profile" ? "profile picture" : "banner image"}`}
          onClose={() => setIsImageModalOpen(false)}
        >
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center text-sm text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-200">
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(event) => uploadAsset(event.target.files?.[0])}
            />
            <span className="text-base font-semibold text-white">Choose image</span>
            <span className="mt-2">PNG or JPG, up to 512 KB.</span>
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

      {isSocialModalOpen && !isStaffUtilityMode ? (
        <ModalCard title="Edit profile" onClose={() => setIsSocialModalOpen(false)}>
          <div className="grid gap-3">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-300">
                Bio
              </span>
              <textarea
                value={draftBio}
                maxLength={240}
                rows={3}
                onChange={(event) => setDraftBio(event.target.value)}
                placeholder="A short introduction"
                className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
              />
            </label>
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
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
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
            Save profile
          </button>
        </ModalCard>
      ) : null}
    </div>
  );
};

const EmptyPanel = ({ title }) => (
  <div className="col-span-full rounded-xl border border-dashed border-white/10 bg-black/10 px-4 py-5">
    <p className="text-sm text-slate-400">{title}</p>
  </div>
);

const WorthStat = ({ label, value }) => (
  <div className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
    <p className="mt-1 text-lg font-black text-white">{value}</p>
  </div>
);

const ModalCard = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
    <div className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-[0_24px_80px_rgba(2,8,23,0.55)] sm:p-6">
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
};

WorthStat.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

ModalCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Profile;
