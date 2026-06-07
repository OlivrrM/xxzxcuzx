import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import useImages from "../hooks/useImages";
import floppyGif from "../assets/floppy.gif";
import { FaApple, FaSteam, FaGithub } from "react-icons/fa";
import Spinner from "../components/Spinner";
import androidIcon from "../assets/xxzx_Icons/Android.png";
import windowsIcon from "../assets/xxzx_Icons/windows.png";
import linuxIcon from "../assets/xxzx_Icons/linux.png";
import iosIcon from "../assets/xxzx_Icons/ios.png";
import romIcon from "../assets/rom.jpg";
import FreeGamesGif from "../assets/freegamesonline.gif"
import PlayButton from "../assets/playButton.png"

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replaceAll(/\s+/g, "-")
    .replaceAll(/[^a-z0-9-]/g, "");

const formatStatus = (value) => {
  if (!value) return "";
  return String(value)
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const Games = () => {
  const { data: games = [], loading, error } = useImages("games");
  const [activeCreditsId, setActiveCreditsId] = useState(null);
  const [activeMoreInfoId, setActiveMoreInfoId] = useState(null);
  const [hoveredGameId, setHoveredGameId] = useState(null);

  const openCredits = (id) => setActiveCreditsId(id);
  const closeCredits = () => setActiveCreditsId(null);
  const openMoreInfo = (id) => setActiveMoreInfoId(id);
  const closeMoreInfo = () => setActiveMoreInfoId(null);

  const sortedGames = [...games].sort((a, b) => {
    const aPriority = a.priority ?? Infinity;
    const bPriority = b.priority ?? Infinity;
    if (aPriority !== bPriority) return aPriority - bPriority;
    const aDate = a.dateCreated ? new Date(a.dateCreated).getTime() : 0;
    const bDate = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
    return bDate - aDate;
  });

  const navigate = useNavigate();

  const activeCreditsGame = activeCreditsId ? games.find((g) => g.id === activeCreditsId) : null;
  const activeMoreInfoGame = activeMoreInfoId ? games.find((g) => g.id === activeMoreInfoId) : null;

  return (
    <div className="p-4 flex flex-col items-center w-full">
      <img src={FreeGamesGif} alt="Free Games" className="w-full max-w-md h-auto mb-8" />

      {loading && <Spinner text="Loading games..." />}
      
      {error && <p className="text-red-600">Error loading entries</p>}
      
      {!loading && !error && sortedGames.length === 0 && (
        <p className="italic">No games entries yet.</p>
      )}

      <ul className="space-y-6 w-full">
          {sortedGames.map((game, index) => {
          const isReversed = index % 2 === 1;

          console.log("GAME TYPE: ", game.gameType);

          const gameMoreInfo = [
            { label: "Released status", value: formatStatus(game.releasedStatus) },
            { label: "Updated", value: game.updated },
            { label: "Published", value: game.published },
          ].filter((item) => Boolean(item.value));
          const imageSrc = game.src || (game.detailImages && game.detailImages[0]);
          const rawEmbed = String(game.url || "").trim();
          const gameType = String(game.gameType || "").toLowerCase();
          const canRenderEmbed = gameType === "web games" && Boolean(rawEmbed);

          const platformLinks = [
              { key: "macLink", icon: FaApple, label: "macOS" },
              { key: "iosLink", imageSrc: iosIcon, label: "iOS" },
              { key: "androidLink", imageSrc: androidIcon, label: "Android" },
              { key: "windowsLink", imageSrc: windowsIcon, label: "Windows" },
              { key: "linuxLink", imageSrc: linuxIcon, label: "Linux" },
              { key: "steamLink", icon: FaSteam, label: "Steam" },
              { key: "romhackingLink", imageSrc: romIcon, label: "Romhacking" },
            ]
              .map((item) => ({
                ...item,
                link: String(game[item.key] || "").trim(),
              }))
              .filter((item) => item.link.length > 0);
          
              const hasPlatformLinks = platformLinks.length > 0;

          return (
            <li key={game.id} className="w-full">
              <div 
                onMouseEnter={() => setHoveredGameId(game.id)}
                onMouseLeave={() => setHoveredGameId(null)}
                className={`p-4 flex flex-col ${isReversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-stretch gap-4 relative overflow-hidden`} 
                style={{
                  ...(game.borderColor ? { border: `2px solid ${game.borderColor}` } : {}),
                  backgroundColor: 'black',
                }}>
                <div 
                  className="absolute inset-0 pointer-events-none transition-all duration-300 ease-out"
                  style={{
                    backgroundImage: game.backGroundImageFile ? `url('${game.backGroundImageFile}')` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: hoveredGameId === game.id ? 0.65 : 0.55,
                    transform: hoveredGameId === game.id ? 'scale(1.1)' : 'scale(1)',
                  }}>
                </div>
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundColor: `rgba(0, 0, 0, ${hoveredGameId === game.id ? 0.25 : 0.35})`,
                  }}>
                </div>
                <div className="absolute inset-0 pointer-events-none"></div>

                <div id="test" className={`w-fit flex flex-col md:flex-row relative z-10`}>
                  <div className={`w-full md:w-[260px] flex items-center justify-center p-2 ${isReversed ? 'md:order-2 md:ml-4' : 'md:order-1 md:mr-2'}`}>
                    {imageSrc ? (
                      <img src={imageSrc} alt={game.name || "Game"} className="w-full h-auto object-cover border"
                        style={{
                          borderColor: game.borderColor || "#fff",
                          borderWidth: "2px",
                          borderStyle: "solid",
                        }}
                      />
                    ) : (
                      <div className="w-full max-w-[220px] h-[140px] bg-white/70 flex items-center justify-center text-sm text-white/60 border border-white">No image available</div>
                    )}
                  </div>

                  {hasPlatformLinks && (
                    <div className={`w-full md:w-auto flex flex-row md:flex-col items-center md:items-center justify-center gap-[21px] pt-2 ${isReversed ? 'md:order-1' : 'md:order-2'}`}>
                      {platformLinks.map(({ key, icon: Icon, imageSrc, label, link }) => (
                        <a key={key} href={link} target="_blank" rel="noopener noreferrer" title={label} className="block">
                          {Icon ? <Icon className="text-white/80" size="20" /> : <img src={imageSrc} alt={label} className="w-6 h-6 object-cover opacity-80" />}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`flex-1 flex flex-col justify-between ${isReversed ? 'md:order-1' : 'md:order-2'} text-left relative z-10`}>
                  <div>
                    <h3 onClick={() => navigate(`/games/${encodeURIComponent(slugify(game.name))}`)} className="text-4xl cursor-pointer font-bold mb-1" style={game.textColor ? { color: game.textColor } : undefined}>{game.name}</h3>

                    {game.description && (
                      <p className="text-base text-white/80 h-[100px] overflow-hidden text-ellipsis mt-2">{game.description}</p>
                    )}
                  </div>

                  <div className={`flex flex-col gap-4 mt-4 text-left md:items-center md:justify-between ${isReversed ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                    <div className="flex flex-col gap-3 text-left">
                      {(canRenderEmbed || game.playableInBrowser) ? (
                        <a href={`/games/${encodeURIComponent(slugify(game.name))}`} target="_blank" rel="noopener noreferrer" className="text-green-400 inline-flex items-center gap-2">
                          <img src={PlayButton} alt="Play" className="w-[35px] h-[35px]" />
                          Playable in Browser
                        </a>
                      ) : <p></p>}

                      {game.platforms && game.platforms.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300">
                          {game.platforms.map((p) => (
                            <span key={p} className="px-1">{p}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {game.githubLink && (
                      <div className="flex justify-start md:justify-center">
                        {game.gameType === "hacks" ? (
                          <img src={romIcon} className="w-5 h-5" alt="Visit Project" />) : (
                            <a
                              href={game.githubLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline w-fit text-blue-400"
                            >
                              Visit Project
                            </a>
                          )}
                      </div>
                    )}

                    <div className="flex flex-col gap-2 text-sm md:flex-row md:items-center">
                      {game.credits && (
                        <a type="button" onClick={() => openCredits(game.id)} className="cursor-pointer text-white underline hover:opacity-90 bg-transparent p-0">Credits</a>
                      )}
                      {gameMoreInfo.length > 0 && (
                        <a type="button" onClick={() => openMoreInfo(game.id)} className="cursor-pointer text-white underline hover:opacity-90 bg-transparent p-0">More Information</a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {activeCreditsGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <button
            onClick={closeCredits}
            className="fixed top-4 right-4 z-[60] text-white text-4xl leading-none hover:opacity-80"
            aria-label="Close credits"
          >
            ×
          </button>

          <div className="bg-black/90 text-white max-w-lg w-full max-h-[90vh] overflow-y-auto rounded p-6 border border-white">
            <h2 className="text-xl font-bold mb-4">Credits</h2>

            <div className="space-y-3">
              {Array.isArray(activeCreditsGame.credits) &&
                activeCreditsGame.credits.map((c, i) => (
                  <div key={i} className="border-b border-white/10 pb-2">
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-sm text-white/70">{c.role}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {activeMoreInfoGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <button
            onClick={closeMoreInfo}
            className="fixed top-4 right-4 z-[60] text-white text-4xl leading-none hover:opacity-80"
            aria-label="Close more information"
          >
            ×
          </button>

          <div className="bg-black/90 text-white max-w-lg w-full max-h-[90vh] overflow-y-auto rounded p-6 border border-white">
            <h2 className="text-xl font-bold mb-4">More Information</h2>

            <div className="space-y-3">
              {[
                {
                  label: "Released status",
                  value: formatStatus(activeMoreInfoGame.releasedStatus),
                },
                {
                  label: "Updated",
                  value: activeMoreInfoGame.updated,
                },
                {
                  label: "Published",
                  value: activeMoreInfoGame.published,
                },
              ]
                .filter((item) => Boolean(item.value))
                .map((item, idx) => (
                  <div key={idx} className="border-b border-white/10 pb-2">
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-sm text-white/70">{item.value}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Games;
