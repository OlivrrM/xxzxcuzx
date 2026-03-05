import React from "react";
import useImages from "../hooks/useImages";

const GAME_GROUPS = [
  { key: "web games", title: "Web Games" },
  { key: "pc games", title: "PC Games" },
  { key: "hacks", title: "Hacks" },
];

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

      {!loading && !error && GAME_GROUPS.map((group) => {
        const groupGames = games.filter((game) => game.gameType === group.key);
        if (groupGames.length === 0) return null;

        return (
          <section key={group.key} className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{group.title}</h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {groupGames.map((game) => {
                const content = (
                  <>
                    {game.src && (
                      <img
                        src={game.src}
                        alt={game.name || "game"}
                        className="w-full h-auto rounded border-2"
                        style={game.borderColor ? { borderColor: game.borderColor } : undefined}
                      />
                    )}
                    <p
                      className="mt-2 text-center font-semibold"
                      style={game.textColor ? { color: game.textColor } : undefined}
                    >
                      {game.name}
                    </p>
                  </>
                );

                return (
                  <li key={game.id} className="rounded">
                    {game.url ? (
                      <a
                        href={game.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        {content}
                      </a>
                    ) : (
                      <div className="block">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
};

export default Games;
