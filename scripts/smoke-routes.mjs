import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const routesText = read("src/routes/routes.jsx");
const navigationText = read("src/utils/navigation.js");
const tournamentCardText = read("src/components/ui/GameCard/TournamentCard.jsx");

const requiredRoutes = [
  'path: "matches"',
  'path: "matches/:id"',
  'path: "tournamentDetails/:id"',
];

const requiredNavigation = ['"/dashboard/matches"', '"/tournamentDetails"'];

const failures = [];

requiredRoutes.forEach((token) => {
  if (!routesText.includes(token)) {
    failures.push(`Missing route token in routes.jsx: ${token}`);
  }
});

requiredNavigation.forEach((token) => {
  if (!navigationText.includes(token)) {
    failures.push(`Missing navigation token in navigation.js: ${token}`);
  }
});

if (!tournamentCardText.includes("to={`/tournamentDetails/${_id}`}")) {
  failures.push("Tournament card still not linking to /tournamentDetails/:id");
}

if (routesText.includes("tournamentDeatils") && !routesText.includes('path: "tournamentDeatils/:id"')) {
  failures.push("Found suspicious 'tournamentDeatils' string outside expected compatibility route.");
}

if (failures.length > 0) {
  console.error("Route smoke check failed:");
  failures.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log("Route smoke check passed.");
