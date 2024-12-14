import { GoTrophy } from "react-icons/go";
import { Button, Footer, FooterNote } from "../components";
import { useSelector } from "react-redux";
import GameCard from "../myComponents/UIElements/GameCard";
import useNavigateHook from "../hooks/useNavigateHook";

const Home = () => {


  
  return (
    <>
      <div className="content">
        <IntroSection />
        <AvailableGameSection />
        <ContentSection />
        <ContentSectionTwo />
        <ContentSectionThree />
        <Footer />
      </div>
    </>
  );
};

const IntroSection = () => {
  const { goToSignUp } = useNavigateHook();
  return (
    <section className="col xc yc tc p-i-s p-b-l txt-primary gap-r1 bg-black w-min-320">
      <video
        src="Battlefield.mp4"
        muted
        autoPlay
        loop
        className="back-vdo"
        typeof="video/mp4"
      />
      <h1 className="h1 mt-6 mb-1">
        COMPETE ON <span className="bg5 p-i-s">EGAMING</span>
      </h1>
      <p className="s">
        Play the games you love. Compete in tournaments. Win real money &
        prizes.
      </p>
      <div>
        <Button
          onClick={goToSignUp}
          size="xxl"
          startIcon={<GoTrophy size={50} />}
          aria-label="Register"
          className="mt-5 mb-6"
        >
          <div className="col tl">
            <small className="txt-muted">Start Playing Now!</small>
            <span>Create Account Now</span>
          </div>
        </Button>
      </div>
    </section>
  );
};

const AvailableGameSection = () => {
  const games = useSelector((store) => store.games);
  return (
    <section className="fw bg1 p-l w-min-320">
      <div className="col pb-6">
        <h4 className="fw">Available Games</h4>
        <div className="row wrap">
          {games.data.map((game) => (
            <GameCard
              key={game.id}
              character={game.character}
              title={game.title}
              background={game.background}
              background_color={game.background_color}
              div_color={game.div_color}
              type="games"
            />
          ))}
          <GameCard type={"coming_soon"} />
        </div>
      </div>
    </section>
  );
};

const ContentSection = () => {
  const { goToSignUp } = useNavigateHook();
  return (
    <>
      <section className="bg3 col yc w-min-320">
        <div className="w-90 col xc">
          <img
            src="ETournament.png"
            alt="EGaming Tournament"
            className="back-img"
          />
          <div className="row xc bg1 tc mt-r-250">
            <div className="w-75 p-5 m-5 pt-250">
              <h5 className="mb-5 txt-main xl">Play Unlimited Tournament</h5>
              <p className="m txt-muted">
                On E-Gaming you can join an unlimited amount of Tournaments at
                the same time across all our games. E-gaming will automatically
                track and score your relevant matches for every Tournament
                you've joined.
              </p>
              <Button onClick={goToSignUp} className="my-5 ">
                Join Now!
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

const ContentSectionTwo = () => {
  const { goToSignUp } = useNavigateHook();
  return (
    <>
      <section className="row wrap bg6 pb-6 pt-6 xc w-min-320">
        <div className="row wrap xc mt-6">
          <img
            src="static-leaderboard.jpg"
            alt="leaderboard"
            className="w-40"
          />
        </div>

        <div className="col tc yc mt-6 w-40 p-5">
          <h5 className="mb-5 txt-main xl">
            Climb to the top of the leaderboard
          </h5>
          <p className="m txt-muted">
            Your position on the Leaderboard is based on your best qualified
            matches, so keep grinding for higher placement. You'll never go
            backwards after having a bad match, your tournament score can only
            ever get better or stay the same.
          </p>
          <Button onClick={goToSignUp} className="my-5 ">
            Join Now!
          </Button>
        </div>
      </section>
    </>
  );
};

const ContentSectionThree = () => {
  const { goToSignUp } = useNavigateHook();
  return (
    <section className="row wrap bg5 res-xc w-min-320">
      <div className="mr-5">
        <img src="Game-character.png" alt="character" />
      </div>
      <div className="w-50 pt-5 pl-5 col res-yc">
        <h4 className="mb-5 txt-primary xl">
          Stop Scrolling, <br />
          Start Playing
        </h4>
        <h5 className="mb-5 txt-primary ">Create your account now and earn</h5>
        <Button
          size="large"
          variant="secondary"
          onClick={goToSignUp}
          className="my-5 "
        >
          Join Now!
        </Button>
      </div>
    </section>
  );
};

export default Home;
