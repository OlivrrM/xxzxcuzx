import React from "react";
import PropTypes from "prop-types";
import { FaApple, FaAndroid, FaWindows, FaLinux, FaSteam, FaMobileAlt } from "react-icons/fa";

const GenericEntryForm = ({
  section,
  isEditing,
  formValues,
  onSubmit,
  onChange,
  onCancelEdit,
  onRevert,
  onClear,
  onFileSelect,
  onUseCreatedDate,
  onUseModifiedDate,
  activeDateSource,
  disableDescription,
  submitDisabled,
  clearDisabled,
  revertDisabled,
  statusMessage,
  statusClassName,
}) => {
  const isPhotography = section === "photography";
  const isGames = section === "games";
  const isMediaUploadSection = section === "photography" || section === "games";
  const normalizedGameColor = /^#[0-9A-Fa-f]{6}$/.test(formValues.textColor || "")
    ? formValues.textColor
    : "#ff0000";
  const normalizedBorderColor = /^#[0-9A-Fa-f]{6}$/.test(formValues.borderColor || "")
    ? formValues.borderColor
    : "#ffffff";
  const submitLabel = isEditing ? "Save" : "Upload";
  const idPrefix = `${section}-entry`;

  return (
    <form onSubmit={onSubmit} className="w-full space-y-4 mb-6">
      {isMediaUploadSection && (
        <div>
          <label
            htmlFor={`${idPrefix}-file`}
            className="block text-start text-sm font-medium mb-1"
          >
            Image file
          </label>
          <input
            id={`${idPrefix}-file`}
            type="file"
            accept="image/*"
            onChange={onFileSelect}
            className="app-input w-full block"
            multiple={!isEditing}
            disabled={isPhotography && isEditing}
          />
        </div>
      )}

      <div>
        <label
          htmlFor={`${idPrefix}-name`}
          className="block text-start text-sm font-medium mb-1"
        >
          Name{isPhotography ? " (optional)" : ""}
        </label>
        <input
          id={`${idPrefix}-name`}
          type="text"
          value={formValues.name}
          onChange={(e) => onChange("name", e.target.value)}
          className="app-input w-full"
          required={isGames}
        />
      </div>

      {!isPhotography && !isGames && (
        <div>
          <label
            htmlFor={`${idPrefix}-url`}
            className="block text-start text-sm font-medium mb-1"
          >
            URL
          </label>
          <input
            id={`${idPrefix}-url`}
            type="text"
            value={formValues.url}
            onChange={(e) => onChange("url", e.target.value)}
            className="app-input w-full"
          />
        </div>
      )}

      {isGames && (
        <div>
          <label
            htmlFor={`${idPrefix}-url`}
            className="block text-start text-sm font-medium mb-1"
          >
            itch.io embed iframe (optional)
          </label>
          <textarea
            id={`${idPrefix}-url`}
            value={formValues.url}
            onChange={(e) => onChange("url", e.target.value)}
            className="app-input w-full min-h-24"
            placeholder={'<iframe frameborder="0" src="https://itch.io/embed-upload/..." allowfullscreen="" width="450" height="820"></iframe>'}
          />
        </div>
      )}

      {isGames && (
        <div className="space-y-3">
          <div>
            <label
              htmlFor={`${idPrefix}-game-type`}
              className="block text-start text-sm font-medium mb-1"
            >
              Game type
            </label>
            <select
              id={`${idPrefix}-game-type`}
              value={formValues.gameType || ""}
              onChange={(e) => onChange("gameType", e.target.value)}
              className="app-input w-full"
              required
            >
              <option value="">Select game type</option>
              <option value="web games">Web games</option>
              <option value="pc games">PC games</option>
              <option value="hacks">Hacks</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={`${idPrefix}-text-color`}
                className="block text-start text-sm font-medium mb-1"
              >
                Text color (hex)
              </label>
              <div className="flex gap-2">
                <input
                  id={`${idPrefix}-text-color`}
                  type="text"
                  value={formValues.textColor || ""}
                  onChange={(e) => onChange("textColor", e.target.value)}
                  className="app-input flex-1"
                  placeholder="#ff0000"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  required
                />
                <input
                  type="color"
                  value={normalizedGameColor}
                  onChange={(e) => onChange("textColor", e.target.value)}
                  className="app-input h-10 w-14 p-1 cursor-pointer"
                  aria-label="Pick text color"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor={`${idPrefix}-border-color`}
                className="block text-start text-sm font-medium mb-1"
              >
                Border color (hex)
              </label>
              <div className="flex gap-2">
                <input
                  id={`${idPrefix}-border-color`}
                  type="text"
                  value={formValues.borderColor || ""}
                  onChange={(e) => onChange("borderColor", e.target.value)}
                  className="app-input flex-1"
                  placeholder="#ffffff"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  required
                />
                <input
                  type="color"
                  value={normalizedBorderColor}
                  onChange={(e) => onChange("borderColor", e.target.value)}
                  className="app-input h-10 w-14 p-1 cursor-pointer"
                  aria-label="Pick border color"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="block text-start text-sm font-medium mb-2">Download links (optional)</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FaApple className="text-white" aria-hidden="true" />
                <input
                  id={`${idPrefix}-mac-link`}
                  type="url"
                  value={formValues.macLink || ""}
                  onChange={(e) => onChange("macLink", e.target.value)}
                  className="app-input flex-1"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <FaMobileAlt className="text-white" aria-hidden="true" />
                <input
                  id={`${idPrefix}-ios-link`}
                  type="url"
                  value={formValues.iosLink || ""}
                  onChange={(e) => onChange("iosLink", e.target.value)}
                  className="app-input flex-1"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <FaAndroid className="text-white" aria-hidden="true" />
                <input
                  id={`${idPrefix}-android-link`}
                  type="url"
                  value={formValues.androidLink || ""}
                  onChange={(e) => onChange("androidLink", e.target.value)}
                  className="app-input flex-1"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <FaWindows className="text-white" aria-hidden="true" />
                <input
                  id={`${idPrefix}-windows-link`}
                  type="url"
                  value={formValues.windowsLink || ""}
                  onChange={(e) => onChange("windowsLink", e.target.value)}
                  className="app-input flex-1"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <FaLinux className="text-white" aria-hidden="true" />
                <input
                  id={`${idPrefix}-linux-link`}
                  type="url"
                  value={formValues.linuxLink || ""}
                  onChange={(e) => onChange("linuxLink", e.target.value)}
                  className="app-input flex-1"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <FaSteam className="text-white" aria-hidden="true" />
                <input
                  id={`${idPrefix}-steam-link`}
                  type="url"
                  value={formValues.steamLink || ""}
                  onChange={(e) => onChange("steamLink", e.target.value)}
                  className="app-input flex-1"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div>
            <p className="block text-start text-sm font-medium mb-2">More information (optional)</p>
            <div className="space-y-2">
              <div>
                <label
                  htmlFor={`${idPrefix}-released-status`}
                  className="block text-start text-sm font-medium mb-1"
                >
                  Released status
                </label>
                <select
                  id={`${idPrefix}-released-status`}
                  value={formValues.releasedStatus || ""}
                  onChange={(e) => onChange("releasedStatus", e.target.value)}
                  className="app-input w-full"
                >
                  <option value="">Select status</option>
                  <option value="released">Released</option>
                  <option value="in development">In development</option>
                  <option value="on hold">On hold</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="prototype">Prototype</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor={`${idPrefix}-updated`}
                    className="block text-start text-sm font-medium mb-1"
                  >
                    Updated
                  </label>
                  <input
                    id={`${idPrefix}-updated`}
                    type="date"
                    value={formValues.updated || ""}
                    onChange={(e) => onChange("updated", e.target.value)}
                    className="app-input w-full"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`${idPrefix}-published`}
                    className="block text-start text-sm font-medium mb-1"
                  >
                    Published
                  </label>
                  <input
                    id={`${idPrefix}-published`}
                    type="date"
                    value={formValues.published || ""}
                    onChange={(e) => onChange("published", e.target.value)}
                    className="app-input w-full"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor={`${idPrefix}-credits`}
                  className="block text-start text-sm font-medium mb-1"
                >
                  Credits
                </label>
                <input
                  id={`${idPrefix}-credits`}
                  type="text"
                  value={formValues.credits || ""}
                  onChange={(e) => onChange("credits", e.target.value)}
                  className="app-input w-full"
                  placeholder="Team or contributor names"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {!isGames && (
        <div>
          <label
            htmlFor={`${idPrefix}-date-created`}
            className="block text-start text-sm font-medium mb-1"
          >
            Date created (optional)
          </label>
          <div className="flex gap-2">
            <input
              id={`${idPrefix}-date-created`}
              type="date"
              value={formValues.dateCreated}
              onChange={(e) => onChange("dateCreated", e.target.value)}
              className={`app-input ${isMediaUploadSection ? "flex-1" : "w-full"}`}
            />
            {isMediaUploadSection && (
              <>
                <button
                  type="button"
                  onClick={onUseCreatedDate}
                  className="app-btn app-btn-secondary"
                  disabled={isPhotography && activeDateSource === "created"}
                >
                  Use created
                </button>
                <button
                  type="button"
                  onClick={onUseModifiedDate}
                  className="app-btn app-btn-secondary"
                  disabled={isPhotography && activeDateSource === "modified"}
                >
                  Use modified
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {isPhotography && (
        <>
          <div>
            <label
              htmlFor={`${idPrefix}-camera-model`}
              className="block text-start text-sm font-medium mb-1"
            >
              Camera model (optional)
            </label>
            <input
              id={`${idPrefix}-camera-model`}
              type="text"
              value={formValues.cameraModel}
              onChange={(e) => onChange("cameraModel", e.target.value)}
              className="app-input w-full"
            />
          </div>

          <div>
            <label
              htmlFor={`${idPrefix}-location`}
              className="block text-start text-sm font-medium mb-1"
            >
              Location (optional)
            </label>
            <input
              id={`${idPrefix}-location`}
              type="text"
              value={formValues.location}
              onChange={(e) => onChange("location", e.target.value)}
              className="app-input w-full"
            />
          </div>
        </>
      )}

      <div>
        <label
          htmlFor={`${idPrefix}-description`}
          className="block text-start text-sm font-medium mb-1"
        >
          Description (optional)
        </label>
        <textarea
          id={`${idPrefix}-description`}
          value={formValues.description}
          onChange={(e) => onChange("description", e.target.value)}
          className="app-input w-full min-h-24"
          disabled={disableDescription}
        />
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        {isEditing && (
          <button type="button" onClick={onCancelEdit} className="app-btn app-btn-secondary">
            Cancel
          </button>
        )}
        {isEditing && (
          <button
            type="button"
            onClick={onRevert}
            className="app-btn app-btn-secondary"
            disabled={revertDisabled}
          >
            Revert
          </button>
        )}
        <button
          type="button"
          onClick={onClear}
          className="app-btn app-btn-secondary"
          disabled={clearDisabled}
        >
          Clear
        </button>
        <button type="submit" className="app-btn app-btn-primary" disabled={submitDisabled}>
          {submitLabel}
        </button>
        {statusMessage && (
          <p className={`ml-auto text-sm text-right ${statusClassName}`}>
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
};

GenericEntryForm.propTypes = {
  section: PropTypes.oneOf(["photography", "software", "games", "placeHolder"]).isRequired,
  isEditing: PropTypes.bool.isRequired,
  formValues: PropTypes.shape({
    name: PropTypes.string,
    url: PropTypes.string,
    description: PropTypes.string,
    dateCreated: PropTypes.string,
    cameraModel: PropTypes.string,
    location: PropTypes.string,
    gameType: PropTypes.string,
    textColor: PropTypes.string,
    borderColor: PropTypes.string,
    macLink: PropTypes.string,
    iosLink: PropTypes.string,
    androidLink: PropTypes.string,
    windowsLink: PropTypes.string,
    linuxLink: PropTypes.string,
    steamLink: PropTypes.string,
    releasedStatus: PropTypes.string,
    updated: PropTypes.string,
    published: PropTypes.string,
    credits: PropTypes.string,
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
  onRevert: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  onFileSelect: PropTypes.func,
  onUseCreatedDate: PropTypes.func,
  onUseModifiedDate: PropTypes.func,
  activeDateSource: PropTypes.oneOf(["created", "modified", null]),
  disableDescription: PropTypes.bool,
  submitDisabled: PropTypes.bool,
  clearDisabled: PropTypes.bool,
  revertDisabled: PropTypes.bool,
  statusMessage: PropTypes.string,
  statusClassName: PropTypes.string,
};

GenericEntryForm.defaultProps = {
  onFileSelect: undefined,
  onUseCreatedDate: undefined,
  onUseModifiedDate: undefined,
  activeDateSource: null,
  disableDescription: false,
  submitDisabled: false,
  clearDisabled: false,
  revertDisabled: false,
  statusMessage: "",
  statusClassName: "text-green-300",
};

export default GenericEntryForm;