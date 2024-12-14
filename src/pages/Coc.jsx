import { Form } from "react-router-dom";
import { Button, Input } from "../components";
import { formData } from "../utils/utility";
import { useState } from "react";
import api from "../api/axios-api";

const Coc = () => {
  const [playerData, setPlayerData] = useState(null);
  const handleSubmit = async (event) => {
    event.preventDefault();
    const gameData = formData(event);
    try {
      const response = await api.post(`/api/games/player`, gameData);
      setPlayerData(response.data);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <>
      <div className="col yc xc p-l gap  ">
        <Form
          onSubmit={handleSubmit}
          method="POST"
          className="col gap p-4 m-b-s bs bg6 w-min-250 w-max-350"
        >
          <h4 className="tc h4">Clash of Clan</h4>
          <label>Username</label>
          <Input type="text" placeholder="Player tag" name="playerTag" />
          <Button type="submit" className="as-c">
            Fetch Data
          </Button>
        </Form>
        <div className="bg1">
          {/* Check if playerData is available and then display it */}
          {playerData ? (
            <pre>{JSON.stringify(playerData, null, 2)}</pre> // Format the JSON with indentation for readability
          ) : (
            <p>No player data available</p>
          )}
        </div>
      </div>
    </>
  );
};
export default Coc;
