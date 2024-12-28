import { GoTrophy } from "react-icons/go";
import { Button, Footer } from "../components";
import { useSelector } from "react-redux";
import GameCard from "../myComponents/UIElements/GameCard";
import useNavigateHook from "../hooks/useNavigateHook";

const Home = () => {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <IntroSection />
      <AvailableGameSection />
      <ContentSection />
      <ContentSectionTwo />
      <ContentSectionThree />
      <Footer />
    </div>
  );
};

const IntroSection = () => {
  const { goToSignUp } = useNavigateHook();

  return (
    <section className="relative flex  flex-wrap items-center justify-between h-[80vh] px-6 bg-black text-white">
      {/* Background Video */}
      <video
        src="Battlefield.mp4"
        muted
        autoPlay
        loop
        className="absolute inset-0 w-full h-full object-cover opacity-70"
        typeof="video/mp4"
      />
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center  justify-between w-full max-w-7xl mx-auto gap-8 pt-10 pb-1">
        {/* Text Section */}
        <div className="flex flex-col items-center  text-center ">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-snug">
            COMPETE ON{" "}
            <span className="inline-block bg-blue-600 text-white px-4 py-2 mt-2 rounded-sm shadow-md">
              E-GAMING
            </span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 max-w-md">
            Play the games you love. Compete in tournaments. Win real money and
            prizes.
          </p>
        </div>
      </div>
      <div className="flex z-10 justify-center flex-wrap w-full md:justify-end ">
        <Button
          onClick={goToSignUp}
          size="xxl"
          variant="primary"
          startIcon={<GoTrophy size={50} />}
          ariaLabel="Register"
          className="shadow-md flex items-center gap-4 md:absolute md:-bottom-8"
        >
          <div className="flex flex-col items-start whitespace-nowrap leading-none">
            <small className="text-gray-200 text-sm">Start Playing!</small>
            <span className="text-lg font-semibold">Create Account Now</span>
          </div>
        </Button>
      </div>
    </section>
  );
};

const AvailableGameSection = () => {
  const games = useSelector((store) => store.games);
  return (
    <section className="flex bg-slate-100 text-left lg:justify-center">
      <div className="flex flex-col w-full lg:max-w-screen-lg py-16 md:p-16  p-4">
        <h2 className="text-xl font-bold text-black mb-8">Available Games</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2  lg:grid-cols-3 gap-4">
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
          <GameCard type="coming_soon" />
        </div>
      </div>
    </section>
  );
};

const ContentSection = () => {
  const { goToSignUp } = useNavigateHook();

  return (
    <section className="p-16 bg-gray-700 flex flex-col items-center text-center">
      {/* Image Section */}
      <img
        src="ETournament.png"
        alt="EGaming Tournament"
        className="w-full max-w-[50vw] object-cover mb-8 rounded-lg shadow-lg"
      />

      {/* Text Content */}
      <div className="max-w-xl text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-yellow-400">
          Play Unlimited Tournaments
        </h2>
        <p className="mb-6 text-gray-300">
          On <span className="text-yellow-400">E-Gaming</span>, you can join an
          unlimited amount of tournaments at the same time across all our games.{" "}
          <span className="text-yellow-400">E-Gaming</span> will automatically
          track and score your relevant matches for every tournament you've
          joined.
        </p>

        {/* Button */}
        <button
          onClick={goToSignUp}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-full shadow-md transition-transform duration-300 ease-in-out hover:scale-105"
        >
          Join Now!
        </button>
      </div>
    </section>
  );
};

const ContentSectionTwo = () => {
  const { goToSignUp } = useNavigateHook();

  return (
    <section className="p-16  bg-gray-800 flex flex-col items-center text-center md:flex-row md:text-left md:items-center md:justify-around gap-8">
      {/* Text Content */}
      <div className="max-w-xl">
        <h3 className="text-2xl md:text-3xl font-bold mb-4 text-yellow-400">
          Climb to the Top of the Leaderboard
        </h3>
        <p className="mb-6 text-gray-300">
          Your position on the leaderboard is based on your best qualified
          matches, so keep grinding for higher placement. You'll never go
          backwards after having a bad match. Your tournament score can only
          ever get better or stay the same.
        </p>

        {/* Button */}
        <button
          onClick={goToSignUp}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-full shadow-md transition-transform duration-300 ease-in-out hover:scale-105"
        >
          Join Now!
        </button>
      </div>
      {/* Image Section */}
      <img
        src="static-leaderboard.jpg"
        alt="Leaderboard"
        className="w-full max-w-[50vw] md:max-w-[25%] ml-4 md:mr-4 rounded-lg shadow-lg"
      />
    </section>
  );
};

const ContentSectionThree = () => {
  const { goToSignUp } = useNavigateHook();

  return (
    <section className="p-16 bg-gray-700 flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:justify-around gap-8">
      {/* Image Section */}
      <img
        src="Game-character.png"
        alt="Game Character"
        className="w-full max-w-[40vw] md:max-w-[25%] rounded-lg shadow-lg"
      />

      {/* Text Content */}
      <div className="max-w-xl">
        <h3 className="text-2xl md:text-3xl font-bold mb-4 text-yellow-400">
          Stop Scrolling, Start Playing
        </h3>
        <p className="mb-6 text-gray-300">
          Create your account now and start earning rewards. Don't wait—join the
          action today!
        </p>

        {/* Button */}
        <button
          onClick={goToSignUp}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-full shadow-md transition-transform duration-300 ease-in-out hover:scale-105"
        >
          Join Now!
        </button>
      </div>
    </section>
  );
};

export default Home;
