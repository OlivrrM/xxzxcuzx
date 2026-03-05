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

const parseGameEmbed = (value) => {
  const input = String(value || "").trim();
  if (!input) return null;

  if (!/^<iframe\b/i.test(input)) {
    return {
      src: input,
      width: null,
      height: null,
      frameBorder: null,
      allowFullScreen: true,
    };
  }

  const srcMatch = /\bsrc\s*=\s*(["'])(.*?)\1/i.exec(input);
  const src = srcMatch?.[2]?.trim() || "";
  if (!src) return null;

  const widthRaw = /\bwidth\s*=\s*(["'])(\d+)\1/i.exec(input)?.[2];
  const heightRaw = /\bheight\s*=\s*(["'])(\d+)\1/i.exec(input)?.[2];
  const frameBorderRaw = /\bframeborder\s*=\s*(["'])(\d+)\1/i.exec(input)?.[2];

  return {
    src,
    width: widthRaw ? Number(widthRaw) : null,
    height: heightRaw ? Number(heightRaw) : null,
    frameBorder: frameBorderRaw ? Number(frameBorderRaw) : null,
    allowFullScreen: /\ballowfullscreen\b/i.test(input),
  };
};

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

  const formatStatus = (value) => {
    if (!value) return "";
    return value
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const gameMoreInfo = [
    { label: "Released status", value: formatStatus(game.releasedStatus) },
    { label: "Updated", value: game.updated },
    { label: "Published", value: game.published },
    { label: "Credits", value: game.credits },
  ].filter((item) => Boolean(item.value));

  const rawEmbed = String(game.url || "").trim();
  const hasIframeMarkup = /^<iframe\b/i.test(rawEmbed);
  const canRenderEmbed = game.gameType === "web games" && hasIframeMarkup;
  const embed = parseGameEmbed(game.url);
  const embedRatio =
    embed?.width && embed?.height ? `${embed.width} / ${embed.height}` : "16 / 9";
  const embedMaxWidth = embed?.width ? `${embed.width}px` : undefined;

  return (
    <div className="p-4 w-full">
      <h1
        className="text-3xl font-bold mb-6"
        style={game.textColor ? { color: game.textColor } : undefined}
      >
        {game.name}
      </h1>

      {canRenderEmbed && embed?.src && (
        <div className="w-full max-w-5xl mx-auto mb-6">
          <div
            className="mx-auto w-full border-2 overflow-hidden"
            style={{
              aspectRatio: embedRatio,
              maxWidth: embedMaxWidth,
              ...(game.borderColor ? { borderColor: game.borderColor } : {}),
            }}
          >
            {React.createElement("iframe", {
              src: embed.src,
              title: game.name || "game embed",
              className: "w-full h-full",
              width: embed.width || undefined,
              height: embed.height || undefined,
              frameBorder: embed.frameBorder ?? 0,
              allowFullScreen: embed.allowFullScreen,
              loading: "lazy",
            })}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto text-center space-y-3">
        {game.description && (
          <p className="text-white">{game.description}</p>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-2 text-white">Download Links</h2>
          {platformLinks.length > 0 ? (
            <div className="flex items-center justify-center gap-5 mt-2">
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

        {gameMoreInfo.length > 0 && (
          <div className="pt-2">
            <h2 className="text-lg font-semibold mb-2 text-white">More Information</h2>
            <div className="space-y-1">
              {gameMoreInfo.map((item) => (
                <p key={item.label} className="text-white">
                  <span className="font-semibold">{item.label}:</span> {item.value}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDetail;