import React from "react";
import PropTypes from "prop-types";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

const ItemList = ({ section, items, loading, onEdit, onDelete }) => {
  if (loading) {
    return <p>Loading entries…</p>;
  }

  const safeItems = items?.filter((item) => item?.id) ?? [];
  const sectionTitles = {
    photography: "Photos",
    games: "Games",
    software: "Software",
    placeHolder: "Place Holder",
  };
  const listTitle = sectionTitles[section] || "Items";

  if (section === "photography" || section === "games") {
    return (
      <div>
        <h3 className="text-xl text-start font-semibold mb-3">{listTitle}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {safeItems.map((item) => (
            <div key={item.id || item.path} className="relative group">
              <img
                src={item.src}
                alt={item.name || "photo"}
                className="w-full h-36 object-cover opacity-80 hover:opacity-100"
              />
              <div className="absolute right-2 top-2 flex gap-2 flex-row-reverse">
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  aria-label="Delete item"
                  title="Delete"
                  className="text-red-700 p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiTrash2 className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  aria-label="Edit item"
                  title="Edit"
                  className="text-white p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiEdit2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl text-start font-semibold mb-3">{listTitle}</h3>
      <div className="space-y-3">
        {safeItems.map((item) => (
          <div key={item.id} className="p-4 bg-white/10 border border-white/10">
            <h3 className="font-semibold text-lg">{item.name}</h3>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 text-sm block break-words"
              >
                {item.url}
              </a>
            )}
            {item.description && <p className="text-sm mt-1">{item.description}</p>}
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => onEdit(item)}
                aria-label="Edit item"
                title="Edit"
                className="app-btn app-btn-secondary px-3"
              >
                <FiEdit2 className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                aria-label="Delete item"
                title="Delete"
                className="app-btn app-btn-danger px-3"
              >
                <FiTrash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

ItemList.propTypes = {
  section: PropTypes.oneOf(["photography", "software", "games", "placeHolder"]).isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      path: PropTypes.string,
      src: PropTypes.string,
      name: PropTypes.string,
      url: PropTypes.string,
      description: PropTypes.string,
    })
  ),
  loading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

ItemList.defaultProps = {
  items: [],
  loading: false,
};

export default ItemList;