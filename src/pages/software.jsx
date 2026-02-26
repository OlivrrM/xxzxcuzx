import React from "react";
import useImages from "../hooks/useImages";

const Software = () => {
  const { data: items, loading, error } = useImages("software");

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
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Software;
