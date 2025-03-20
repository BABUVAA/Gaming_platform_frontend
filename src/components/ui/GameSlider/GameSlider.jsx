import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import GameCard from "../GameCard/GameCard";

const GameSlider = () => {
  const games = useSelector((store) => store.games?.data || []);
  const sliderRef = useRef(null);
  const [scrollX, setScrollX] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(2); // Default for mobile

  // Duplicate games for smooth infinite scroll effect
  const gameList = [...games, ...games];

  useEffect(() => {
    updateCardsPerView();
    window.addEventListener("resize", updateCardsPerView);
    return () => window.removeEventListener("resize", updateCardsPerView);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      handleSlide("next");
    }, 3000);
    return () => clearInterval(interval);
  }, [cardsPerView]);

  const updateCardsPerView = () => {
    if (window.innerWidth < 640) {
      setCardsPerView(2); // Mobile: 2 cards max
    } else if (window.innerWidth < 1024) {
      setCardsPerView(3); // Tablet: 3 cards
    } else {
      setCardsPerView(4); // Desktop: 4 cards
    }
  };

  const handleSlide = (direction) => {
    if (!sliderRef.current) return;

    const cardWidth = sliderRef.current.offsetWidth / cardsPerView;
    let newScrollX = scrollX + (direction === "next" ? cardWidth : -cardWidth);

    if (newScrollX >= sliderRef.current.scrollWidth / 2) {
      newScrollX = 0;
    } else if (newScrollX < 0) {
      newScrollX = sliderRef.current.scrollWidth / 2 - cardWidth;
    }
    setScrollX(newScrollX);
    sliderRef.current.scrollTo({ left: newScrollX, behavior: "smooth" });
  };

  return (
    <div className="relative max-w-[90vw] mx-auto mt-10 ">
      {/* Left Button */}
      <button
        className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-900 bg-opacity-50 text-white p-2 rounded-full z-10 hover:bg-opacity-70"
        onClick={() => handleSlide("prev")}
      >
        ❮
      </button>

      {/* Game Slider */}
      <div ref={sliderRef} className="overflow-hidden w-full ">
        <div className="flex gap-4 transition-transform duration-500 ease-in-out">
          {gameList.map((game, index) => (
            <div key={index}>
              <GameCard
                character={game.character}
                title={game.title}
                background={game.background}
                background_color={game.background_color}
                div_color={game.div_color}
                type="games"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right Button */}
      <button
        className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-900 bg-opacity-50 text-white p-2 rounded-full z-10 hover:bg-opacity-70"
        onClick={() => handleSlide("next")}
      >
        ❯
      </button>
    </div>
  );
};

export default GameSlider;
