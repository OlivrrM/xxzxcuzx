import React from "react";
import useImages from "../hooks/useImages";

const Games = () => {
  const { data: games, loading, error } = useImages("games");

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Games</h1>
      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">Error loading entries</p>}
      {!loading && !error && games.length === 0 && (
        <p className="italic">No games entries yet.</p>
      )}
      <ul className="space-y-4">
        {games.map((game) => (
          <li key={game.id} className="border p-3 rounded">
            <h2 className="font-semibold">{game.name}</h2>
            {game.src && (
              <img
                src={game.src}
                alt={game.name || "game"}
                className="mt-2 w-full max-w-md h-auto rounded"
              />
            )}
            {game.description && <p>{game.description}</p>}
            {game.url && (
              <a
                href={game.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                Play / Download
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Games;
