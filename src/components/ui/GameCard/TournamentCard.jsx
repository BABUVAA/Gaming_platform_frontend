import React from "react";

const TournamentCard = ({ tournament }) => {
  // Progress calculation based on number of participants
  const progress =
    (tournament.currentParticipants / tournament.maxParticipants) * 100;

  return (
    <div className="relative p-4 border rounded-lg shadow-lg bg-white">
      {/* Tournament Image - Centralized and Larger */}
      <div className="relative w-full h-48 mb-4">
        <img
          src={tournament.image}
          alt={tournament.name}
          className="w-full h-full object-cover rounded-lg"
        />
        <div className="absolute top-0 left-0 p-2 bg-opacity-60 bg-gray-800 text-white rounded-tl-lg rounded-br-lg flex items-center space-x-2">
          <span className="text-sm">{tournament.status}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xl font-semibold text-gray-800">
          {tournament.name}
        </h4>
        <div className="flex items-center space-x-2">
          {/* Dynamically render tags */}
          {tournament.tags.map((tag, index) => (
            <span
              key={index}
              className={`${
                tag === "Featured" ? "bg-blue-500" : "bg-green-500"
              } text-white text-xs px-2 py-1 rounded-full`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Progress Bar for Participants */}
      <div className="mt-4">
        <div className="text-sm text-gray-600">Participants</div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          {tournament.currentParticipants}/{tournament.maxParticipants}{" "}
          Participants
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm font-semibold text-gray-600">
          {tournament.status === "Upcoming" ? "Top 300 Players" : "Finished"}
        </div>
        <span
          className={`${
            tournament.status === "Ongoing" ? "bg-green-500" : "bg-gray-500"
          } text-white text-xs px-2 py-1 rounded-full`}
        >
          {tournament.status}
        </span>
      </div>

      <div className="border-t p-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          <span className="inline-block h-5 w-5">₹</span>{" "}
          {tournament.prizeAmount}
        </div>
        <div className="flex flex-col items-center text-sm">
          <span className="text-gray-600">Receive prizing</span>
          <button className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
            Join Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default TournamentCard;
