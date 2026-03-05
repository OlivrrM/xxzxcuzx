import React from "react";
import { useParams } from "react-router";
import { FaApple, FaAndroid, FaWindows, FaLinux, FaSteam, FaMobileAlt } from "react-icons/fa";
import useImages from "../hooks/useImages";

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replaceAll(/\s+/g, "-")
    .replaceAll(/[^a-z0-9-]/g, "");

const GameDetail = () => {
  const { gameName } = useParams();
  const { data: games, loading, error } = useImages("games");
  const decodedName = decodeURIComponent(gameName || "");

  const game =
    games.find((entry) => slugify(entry.name) === decodedName.toLowerCase()) ||
    games.find((entry) => entry.name?.toLowerCase() === decodedName.toLowerCase());

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Game</h1>
        <p>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Game</h1>
        <p className="text-red-600">Error loading game.</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Game not found</h1>
      </div>
    );
  }

  const platformLinks = [
    { key: "macLink", icon: FaApple, label: "macOS" },
    { key: "iosLink", icon: FaMobileAlt, label: "iOS" },
    { key: "androidLink", icon: FaAndroid, label: "Android" },
    { key: "windowsLink", icon: FaWindows, label: "Windows" },
    { key: "linuxLink", icon: FaLinux, label: "Linux" },
    { key: "steamLink", icon: FaSteam, label: "Steam" },
  ].filter((item) => Boolean(game[item.key]));

  return (
    <div className="p-4 w-full">
      <h1
        className="text-3xl font-bold mb-6"
        style={game.textColor ? { color: game.textColor } : undefined}
      >
        {game.name}
      </h1>

      {game.url && (
        <div className="w-full max-w-5xl mx-auto mb-6">
          {React.createElement("iframe", {
            src: game.url,
            title: game.name || "game embed",
            className: "w-full aspect-video border-2",
            style: game.borderColor ? { borderColor: game.borderColor } : undefined,
            allowFullScreen: true,
            loading: "lazy",
          })}
        </div>
      )}

      <div className="max-w-5xl mx-auto text-left space-y-3">
        {game.description && (
          <p className="text-white">{game.description}</p>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-2 text-white">Download Links</h2>
          {platformLinks.length > 0 ? (
            <div className="flex items-center justify-center gap-5">
              {platformLinks.map(({ key, icon: Icon, label }) => (
                <a
                  key={key}
                  href={game[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="text-white text-2xl"
                >
                  <Icon />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-white/80">No download links available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameDetail;