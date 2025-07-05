import { useState } from "react";

const CreateTemplate = ({ socket }) => {
  const [formData, setFormData] = useState({
    tournamentName: "",
    game: "",
    mode: "",
    map: "",
    entryFee: 0,
    prizePool: 0,
    maxParticipants: 0,
    teamSize: 1,
    status: "upcoming",
    category: "none",
    imageUrl: "",
    isFeatured: false,
    preparationTime: 900,
    battleDuration: 2700,
    rewards: [],
  });

  const [rewardSlot, setRewardSlot] = useState({
    slotStart: "",
    slotEnd: "",
    amount: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRewardChange = (e) => {
    const { name, value } = e.target;
    setRewardSlot((prev) => ({ ...prev, [name]: value }));
  };

  const addRewardSlot = () => {
    const { slotStart, slotEnd, amount } = rewardSlot;
    if (!slotStart || !slotEnd || !amount)
      return alert("Please fill reward fields");

    setFormData((prev) => ({
      ...prev,
      rewards: [
        ...prev.rewards,
        { slotStart: +slotStart, slotEnd: +slotEnd, amount: +amount },
      ],
    }));
    setRewardSlot({ slotStart: "", slotEnd: "", amount: "" });
  };

  const removeRewardSlot = (index) => {
    setFormData((prev) => ({
      ...prev,
      rewards: prev.rewards.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.tournamentName || !formData.game)
      return alert("Required fields missing");
    socket.emit("newTournament", formData);
    alert("Tournament Created");
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Create Tournament Template</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="tournamentName"
          placeholder="Tournament Name"
          value={formData.tournamentName}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <select
          name="game"
          value={formData.game}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="">Select Game</option>
          <option value="bgmi">BGMI</option>
          <option value="coc">COC</option>
        </select>

        <select
          name="mode"
          value={formData.mode}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="">Select Mode</option>
          <option value="solo">Solo</option>
          <option value="duo">Duo</option>
          <option value="squad">Squad</option>
          <option value="5v5">5v5</option>
        </select>

        <input
          name="map"
          placeholder="Map"
          value={formData.map}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <input
          type="number"
          name="entryFee"
          placeholder="Entry Fee"
          value={formData.entryFee}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <input
          type="number"
          name="prizePool"
          placeholder="Prize Pool"
          value={formData.prizePool}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <input
          type="number"
          name="maxParticipants"
          placeholder="Max Participants"
          value={formData.maxParticipants}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <input
          type="number"
          name="teamSize"
          placeholder="Team Size"
          value={formData.teamSize}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <label className="flex items-center">
          <input
            type="checkbox"
            name="isFeatured"
            checked={formData.isFeatured}
            onChange={handleChange}
          />
          <span className="ml-2 text-sm">Featured</span>
        </label>

        <input
          type="text"
          name="imageUrl"
          placeholder="Image URL"
          value={formData.imageUrl}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <div>
          <label className="text-sm font-medium">Add Reward Slot</label>
          <div className="flex gap-2 mt-1">
            <input
              type="number"
              name="slotStart"
              value={rewardSlot.slotStart}
              onChange={handleRewardChange}
              placeholder="From"
              className="p-2 border rounded w-1/4"
            />
            <input
              type="number"
              name="slotEnd"
              value={rewardSlot.slotEnd}
              onChange={handleRewardChange}
              placeholder="To"
              className="p-2 border rounded w-1/4"
            />
            <input
              type="number"
              name="amount"
              value={rewardSlot.amount}
              onChange={handleRewardChange}
              placeholder="Amount"
              className="p-2 border rounded w-1/4"
            />
            <button
              type="button"
              onClick={addRewardSlot}
              className="bg-green-500 text-white px-4 rounded"
            >
              Add
            </button>
          </div>
        </div>

        <ul className="text-sm space-y-1">
          {formData.rewards.map((r, i) => (
            <li key={i} className="flex justify-between">
              Ranks {r.slotStart}–{r.slotEnd} — ₹{r.amount}
              <button
                type="button"
                onClick={() => removeRewardSlot(i)}
                className="text-red-500"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded"
        >
          Create Tournament
        </button>
      </form>
    </div>
  );
};

export default CreateTemplate;
