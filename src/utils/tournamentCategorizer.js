const tournamentCategorizer = (tournaments) => {
  // Create the categories object
  const categorizedTournaments = {
    upcoming: [],
    registration_open: [],
    active: [],
    ongoing: [],
    completed: [],
    cancelled: [],
    featured: [],
    gameCategories: {}, // To categorize tournaments by their game type
  };

  // Loop through each tournament and categorize it
  Object.values(tournaments).forEach((tournament) => {
    // Categorize based on status
    switch (tournament.status) {
      case "upcoming":
        categorizedTournaments.upcoming.push(tournament);
        break;
      case "registration_open":
        categorizedTournaments.registration_open.push(tournament);
        break;
      case "active":
        categorizedTournaments.active.push(tournament);
        break;
      case "ongoing":
        categorizedTournaments.ongoing.push(tournament);
        break;
      case "completed":
        categorizedTournaments.completed.push(tournament);
        break;
      case "cancelled":
        categorizedTournaments.cancelled.push(tournament);
        break;
      default:
        break;
    }

    // Categorize by featured flag
    if (tournament.isFeatured) {
      categorizedTournaments.featured.push(tournament);
    }

    // Categorize by game (if there's a field for game)
    if (tournament.game) {
      if (!categorizedTournaments.gameCategories[tournament.game]) {
        categorizedTournaments.gameCategories[tournament.game] = [];
      }
      categorizedTournaments.gameCategories[tournament.game].push(tournament);
    }
  });

  return categorizedTournaments;
};

export default tournamentCategorizer;
