import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("player competition routes use only canonical Quick Match clients", async () => {
  const [dashboardRoutes, publicRoutes, registry, gamePage, rootReducer, quickMatchSlice] =
    await Promise.all([
      read("../src/routes/dashboardRoutes.jsx"),
      read("../src/routes/publicRoutes.jsx"),
      read("../src/routes/routeRegistry.jsx"),
      read("../src/pages/Game.jsx"),
      read("../src/store/rootReducer.js"),
      read("../src/store/slices/quickMatchOfferingSlice.js"),
    ]);

  assert.match(dashboardRoutes, /componentKey: "QuickMatchDetails"/);
  assert.match(registry, /pages\/QuickMatchDetails\.jsx/);
  assert.match(gamePage, /fetchPlayerQuickMatchOfferings/);
  assert.match(quickMatchSlice, /path: "\/api\/player\/quick-matches"/);

  const activeSource = [dashboardRoutes, publicRoutes, registry, gamePage, rootReducer].join("\n");
  assert.doesNotMatch(activeSource, /TournamentDetails|tournamentSlice|\/api\/tournaments/);
});

test("legacy Tournament UI modules and routes are absent", async () => {
  const [routeConstants, socketSource, adminSlice] = await Promise.all([
    read("../src/routes/routeConstants.js"),
    read("../src/context/socketContext.jsx"),
    read("../src/store/slices/adminSlice.js"),
  ]);

  assert.doesNotMatch(routeConstants, /tournamentDetails|tournamentDeatils/);
  assert.doesNotMatch(socketSource, /newTournament|updateTournament/);
  assert.doesNotMatch(adminSlice, /findTournaments/);

  for (const path of [
    "../src/pages/TournamentDetails.jsx",
    "../src/pages/TournamentGame.jsx",
    "../src/store/slices/tournamentSlice.js",
    "../src/store/selectors/tournamentSelectors.js",
    "../src/components/ui/GameCard/TournamentCard.jsx",
  ]) {
    await assert.rejects(access(new URL(path, import.meta.url)));
  }
});

test("Compete renders Events and Quick Matches as compact two-column poster cards", async () => {
  const [gamePage, eventCard] = await Promise.all([
    read("../src/pages/Game.jsx"),
    read("../src/components/competition/EventCompetitionCard.jsx"),
  ]);

  assert.match(gamePage, /filteredTournaments\.map\(\(tournament\)/);
  assert.match(gamePage, /grid-cols-1 gap-4 sm:grid-cols-2/);
  assert.match(gamePage, /src=\{presentation\.image\}/);
  assert.match(gamePage, /absolute inset-0 bg-\[linear-gradient/);
  assert.match(gamePage, /Mode · \{tournament\.mode\}/);
  assert.match(gamePage, /Capacity/);
  assert.match(gamePage, /% full/);
  assert.match(gamePage, /placementRewards/);
  assert.match(gamePage, /grid grid-cols-3 gap-2 sm:gap-3/);
  assert.match(gamePage, /h-24 overflow-hidden.*sm:h-36.*md:h-44/);
  assert.match(gamePage, /hidden text-\[10px\].*sm:block/);
  assert.match(gamePage, /useMatchmakingStore/);
  assert.match(gamePage, /tournament\.membership\?\.isJoined/);
  assert.match(gamePage, /"Join Now"/);
  assert.match(gamePage, />\s*Joined\s*</);
  assert.match(eventCard, /src=\{presentation\.image\}/);
  assert.match(eventCard, /absolute inset-0 bg-\[linear-gradient/);
  assert.match(eventCard, /min-h-\[18rem\]/);
  assert.match(eventCard, /"Join Now"/);
  assert.match(eventCard, />\s*Joined\s*</);
  assert.doesNotMatch(eventCard, /Registration committed \/ cancellation unavailable/);
  assert.doesNotMatch(gamePage, /Ready, \$\{username\}|selectPlayerSummary/);
  assert.match(gamePage, />\s*Events\s*<\/h2>/);
  assert.match(gamePage, />\s*Quick Matches\s*<\/h2>/);
  assert.doesNotMatch(gamePage, />\s*Tournaments\s*<\/h2>/);
  assert.doesNotMatch(gamePage, /for the selected game/);
  assert.doesNotMatch(gamePage, /SpotlightTournament/);
});

test("player Matches separates live activity from completed history", async () => {
  const [matchesPage, matchRoom] = await Promise.all([
    read("../src/pages/Matches.jsx"),
    read("../src/pages/MatchRoom.jsx"),
  ]);

  assert.match(matchesPage, /COMPLETED_STATUSES/);
  assert.match(matchesPage, /\["live", "Live Matches", liveMatches\.length\]/);
  assert.match(matchesPage, /\["completed", "Completed", completedMatches\.length\]/);
  assert.match(matchesPage, /role="tablist"/);
  assert.match(matchesPage, /liveMatches/);
  assert.match(matchesPage, /completedMatches/);
  assert.match(matchesPage, /getGamePresentation/);
  assert.match(matchesPage, /Event\$\{item\.event\?\.stage/);
  assert.match(matchesPage, /Room filling/);
  assert.match(matchesPage, /aria-label="Refresh matches"/);
  assert.match(matchesPage, /View Quick Match/);
  assert.match(matchesPage, /Start delayed · waiting for operator/);
  assert.doesNotMatch(matchesPage, /fillPercentage|progress/i);
  assert.doesNotMatch(matchesPage, /Match timeline|InfoPanel|Everything you joined/);
  assert.match(matchRoom, /const TABS = \["lobby", "chat", "dispute", "results"\]/);
  assert.match(matchRoom, /Solo seats/);
  assert.match(matchRoom, /Duo slots/);
  assert.match(matchRoom, /fillTeamGroups\(match, teamSize, capacity\)/);
  assert.match(matchRoom, /competitionUnitKey/);
  assert.match(matchRoom, /Math\.ceil\(capacity \/ size\)/);
  assert.match(matchRoom, /BgmiPlayerTile/);
  assert.match(matchRoom, /lg:grid-cols-2/);
  assert.match(matchRoom, /grid-cols-2 sm:grid-cols-4/);
  assert.match(matchRoom, /CocPlayerRow/);
  assert.match(matchRoom, /Team \{side \? "B" : "A"\}/);
  assert.match(matchRoom, />VS</);
  assert.match(matchRoom, /selectAuthUser/);
  assert.match(matchRoom, /isCurrentUser/);
  assert.match(matchRoom, /Your team/);
  assert.match(matchRoom, /placementRanking/);
  assert.match(matchRoom, /Start delayed · waiting for operator/);
  assert.doesNotMatch(matchRoom, /Progress Rail|const FLOW/);
});

test("Quick Match details mirror the compact Event tab layout and reopen after full", async () => {
  const [detailPage, gamePage, quickCard] = await Promise.all([
    read("../src/pages/QuickMatchDetails.jsx"),
    read("../src/pages/Game.jsx"),
    read("../src/components/ui/GameCard/QuickMatchCard.jsx"),
  ]);

  assert.match(detailPage, /\["rewards", "leaderboard"\]/);
  assert.match(detailPage, /Join Next Room/);
  assert.match(detailPage, /left="-"/);
  assert.doesNotMatch(detailPage, /OverviewBlock|QuickMatchCard/);
  assert.match(gamePage, /roomStatus === "full"/);
  assert.match(quickCard, /result\.roomStatus !== "full"/);
});

test("player dashboard tabs use the compact shell and omit promotional heroes", async () => {
  const [sidebar, chats, wallet, gameAccounts, profile, clanStyles] =
    await Promise.all([
      read("../src/components/layout/SideBar/SideBar.jsx"),
      read("../src/pages/Chats.jsx"),
      read("../src/pages/Wallet.jsx"),
      read("../src/pages/GameAccounts.jsx"),
      read("../src/pages/Profile.jsx"),
      read("../src/styles/index.css"),
    ]);

  assert.match(sidebar, /md:w-56/);
  assert.doesNotMatch(sidebar, /Competition Hub|item\.description/);
  assert.doesNotMatch(chats, /Coordinate clan traffic|text-5xl/);
  assert.doesNotMatch(gameAccounts, /Connect your game identities before match time/);
  assert.match(wallet, /text-2xl font-black text-white">Wallet/);
  assert.match(profile, /relative h-32 bg-cover bg-center md:h-40/);
  assert.match(clanStyles, /\.clan-hero \{[\s\S]*?min-height: 0/);
});

test("Clan overview keeps its description and profile compact on phones", async () => {
  const [clanPage, styles] = await Promise.all([
    read("../src/pages/Clan.jsx"),
    read("../src/styles/index.css"),
  ]);

  assert.match(clanPage, /descriptionExpanded/);
  assert.match(clanPage, /clan-bookmark-strip/);
  assert.doesNotMatch(clanPage, />Your Clan</);
  assert.match(clanPage, /title="Copy clan tag"/);
  assert.doesNotMatch(clanPage, />Clan roster</);
  assert.match(clanPage, />Members<\/h2>/);
  assert.doesNotMatch(clanPage, /clan-role-summary/);
  assert.doesNotMatch(clanPage, /clan-member-row__joined/);
  assert.match(clanPage, /aria-label=\{isBookmarked \? "Remove clan bookmark" : "Bookmark clan"\}/);
  assert.doesNotMatch(clanPage, /isBookmarked \? "Saved" : "Save"/);
  assert.match(clanPage, /clan-description--collapsed/);
  assert.match(clanPage, /"Read more"/);
  assert.match(clanPage, /space-y-3 sm:space-y-5/);
  assert.match(styles, /\.clan-description--collapsed[\s\S]*-webkit-line-clamp: 3/);
  assert.match(styles, /\.clan-bookmark-strip[\s\S]*clip-path:/);
  assert.match(styles, /\.clan-create textarea,[\s\S]*height: 6rem/);
  assert.match(styles, /grid-template-columns: repeat\(auto-fit, minmax\(7rem, 1fr\)\)/);
  assert.doesNotMatch(styles, /\.clan-role-summary/);
});
