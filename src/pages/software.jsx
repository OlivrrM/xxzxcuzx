import React from "react";
import Spinner from "../components/Spinner";
import { FaGithub } from "react-icons/fa";
import useImages from "../hooks/useImages";
import notAvailable from "../assets/down.gif";
import softwareGif from "../assets/software.gif";
import floppyGif from "../assets/floppy.gif";

const Software = () => {
  const { data: items, loading, error } = useImages("software");
  const disabled = false;

  if (disabled) {
    return (
      <div className="flex flex-1 justify-center items-center p-4">
        <img src={notAvailable} alt="Not available" className="w-[300px] h-auto pb-[300px]" />
      </div>
    );
  }

  const sortedItems = [...items].sort((a, b) => {
    // Sort by priority first (lower number = higher priority)
    const aPriority = a.priority ?? Infinity;
    const bPriority = b.priority ?? Infinity;
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    // If priorities are equal, fall back to date
    const aDate = a.dateCreated ? new Date(a.dateCreated).getTime() : 0;
    const bDate = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
    return bDate - aDate;
  });

  return (
    <div className="p-4 flex flex-col items-center w-full">
      <img src={softwareGif} alt="Software" className="text-2xl font-bold h-[150px] w-[340px] object-cover" />
      {loading && <Spinner text="Loading software..." />}
      {error && <p className="text-red-600">Error loading entries</p>}
      {!loading && !error && sortedItems.length === 0 && (
        <p className="italic">No software entries yet.</p>
      )}
      <ul className="space-y-6">
        {sortedItems.map((app, index) => {
          const isReversed = index % 2 === 1;
          const imageSrc = app.src || (app.detailImages && app.detailImages[0]);

          return (
            <li
              key={app.id}
              className="border p-4 flex flex-col md:flex-row gap-4 items-stretch"
            >
              <div
                className={`flex items-center justify-center ${
                  isReversed ? "md:order-2" : "md:order-1"
                }`}
              >
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={app.name || "Software"}
                    className="w-full max-w-[300px] h-auto object-cover"
                  />
                ) : (
                  <div className="w-full max-w-[300px] h-[160px] bg-white/10 flex items-center justify-center text-sm text-white/60">
                    No image available
                  </div>
                )}
              </div>

              <div
                className={`flex-1 flex flex-col justify-between ${
                  isReversed ? "md:order-1" : "md:order-2"
                } text-center md:text-left`}
              >
                <div>
                  <h2 className="font-semibold text-white text-3xl">{app.name}</h2>
                  {app.subtext1 && <p className="text-xl mb-3 text-gray-300">{app.subtext1}</p>}
                  {app.subtext2 && <p className="text-xl text-gray-500">{app.subtext2}</p>}
                  {app.blurb && (
                    <p
                      className={`text-2xl text-white/80 mt-3 ${isReversed ? "md:text-end" : "md:text-start"}`}
                    >
                      {app.blurb}
                    </p>
                  )}
                </div>

                <div className={`flex w-full ${isReversed ? "flex-row-reverse" : "flex-row"} items-center gap-2 mt-4`}>
                  {app.downloadLink && (
                    <a
                      href={app.downloadLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="download button"
                    >
                      <img src={floppyGif} alt="Floppy disk" className="w-10 h-auto" />
                    </a>
                  )}
                  {app.url && (
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 mx-auto underline"
                    >
                      Visit project
                    </a>
                  )}
                  {app.githubLink && (
                    <a href={app.githubLink} target="_blank" rel="noopener noreferrer" className="ml-2 text-white/90">
                      <FaGithub />
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Software;
