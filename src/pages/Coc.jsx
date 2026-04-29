import { Form } from "react-router-dom";
import { useState } from "react";
import { FiSearch, FiShield } from "react-icons/fi";
import { Button, Input } from "../components";
import { formData } from "../utils/utility";
import api from "../api/axios-api";

const Coc = () => {
  const [playerData, setPlayerData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const gameData = formData(event);
    try {
      setIsLoading(true);
      const response = await api.post(`/api/games/player`, gameData);
      setPlayerData(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_28%),linear-gradient(180deg,_rgba(8,15,28,0.96),_rgba(2,6,17,0.98))] p-6 shadow-[0_24px_70px_rgba(2,8,23,0.45)] md:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">
          Clash of Clans
        </p>
        <h1 className="mt-4 text-3xl font-black text-white md:text-4xl">
          Inspect a player profile before linking or verification.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          Use the player tag to preview account data, confirm identity details, and support the CoC verification workflow.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-3 text-cyan-300">
              <FiShield />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Player lookup</h2>
              <p className="mt-1 text-sm text-slate-400">
                Enter a tag to fetch the current in-game profile snapshot.
              </p>
            </div>
          </div>

          <Form onSubmit={handleSubmit} method="POST" className="space-y-3">
            <Input
              type="text"
              placeholder="#PLAYER123"
              name="playerTag"
              label="Player tag"
              iconStart={<FiSearch />}
            />
            <Button
              type="submit"
              isLoading={isLoading}
              className="h-14 w-full rounded-2xl bg-cyan-300 text-sm font-black uppercase tracking-[0.16em] text-slate-950 hover:bg-cyan-200"
            >
              Fetch Profile
            </Button>
          </Form>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
            Result
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">Fetched player data</h2>
          <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4">
            {playerData ? (
              <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">
                {JSON.stringify(playerData, null, 2)}
              </pre>
            ) : (
              <p className="text-sm leading-6 text-slate-400">
                No player data loaded yet. Run a lookup and the response will appear here.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Coc;
