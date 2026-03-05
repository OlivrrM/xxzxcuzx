import React from "react";
import PropTypes from "prop-types";

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
}) => {
  const isPhotography = section === "photography";
  const isMediaUploadSection = section === "photography" || section === "games";
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
            multiple
            disabled={isEditing}
          />
        </div>
      )}

      <div>
        <label
          htmlFor={`${idPrefix}-name`}
          className="block text-start text-sm font-medium mb-1"
        >
          Name{isMediaUploadSection ? " (optional)" : ""}
        </label>
        <input
          id={`${idPrefix}-name`}
          type="text"
          value={formValues.name}
          onChange={(e) => onChange("name", e.target.value)}
          className="app-input w-full"
        />
      </div>

      {!isPhotography && (
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

      <div className="flex gap-2">
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
};

export default GenericEntryForm;