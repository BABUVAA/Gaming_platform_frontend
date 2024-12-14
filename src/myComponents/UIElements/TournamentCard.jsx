import "../../styles/TournamentCard.css";

const TournamentCard = () => {
  return (
    <a className="tournament-card-container">
      <div className="tournament-card-Logo">
        <img src="./coc_title.png" alt="coc" width="64px" height="32px" />
      </div>
      <div className="tournament-card-details">
        <img
          src="./coc_character.png"
          width="40px"
          height="40px"
          alt="image"
        ></img>
        <div className="tournament-card-info">
          <p>Monday Bang Bang</p>
          <div className="tournament-card-tags">
            <div>Leaderboard</div>
            <div>daily</div>
            <div>All server</div>
            <div>Solo </div>
            <div>TPP</div>
            <div>Mobile</div>
            <div>Erangal</div>
          </div>
        </div>
      </div>
      <div className="tournament-card-prizing">
        <div className="tournament-card-prizing-info">
          Top 100 Players
          <span> Started</span>
        </div>
        <span>Receive prizing</span>
      </div>
      <div className="tournament-card-prize-pool">
        <div>$ 100.00</div>
        <span>Prize pool</span>
      </div>
      <div className="tournament-card-entry">
        Free entry
        <span>Closes in 13 Hours</span>
      </div>
    </a>
  );
};

export default TournamentCard;
