import React from "react";
import useImages from "../hooks/useImages";
import notAvailable from "../assets/down.gif";

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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Software</h1>
      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">Error loading entries</p>}
      {!loading && !error && items.length === 0 && (
        <p className="italic">No software entries yet.</p>
      )}
      <ul className="space-y-4">
        {items.map((app) => (
          <li key={app.id} className="border p-3 rounded">
            <h2 className="font-semibold">{app.name}</h2>
            {app.description && <p>{app.description}</p>}
            {app.subtext1 && <p className="text-sm text-gray-600">{app.subtext1}</p>}
            {app.subtext2 && <p className="text-sm text-gray-600">{app.subtext2}</p>}
            {app.blurb && <p className="italic">{app.blurb}</p>}
            {app.url && (
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                Visit project
              </a>
            )}
            {app.detailImages && app.detailImages.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium">Images:</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {app.detailImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Image ${idx + 1}`}
                      className="w-20 h-20 object-cover rounded"
                    />
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Software;
