# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

### Firebase / Firestore configuration

This project now reads its content from a Firestore database rather than local JSON files. Three collections are expected:
`photography`, `software` and `games`. Each document is validated against a [Zod](https://github.com/colinhacks/zod) schema before it is used in the UI.

To get started:

1. `npm install firebase zod` (or `yarn add firebase zod`).
2. Create a Firebase project and enable Firestore and Email/Password Authentication in the console.
3. Add the following environment variables to a `.env` file in the project root (CRA automatically exposes variables prefixed with `REACT_APP_`):
   ```
   REACT_APP_FIREBASE_API_KEY=...
   REACT_APP_FIREBASE_AUTH_DOMAIN=...
   REACT_APP_FIREBASE_PROJECT_ID=...
   REACT_APP_FIREBASE_STORAGE_BUCKET=...
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
   REACT_APP_FIREBASE_APP_ID=...
   ```
4. Seed the three collections with documents that match the schemas defined in `src/schemas/index.js`.

   You can use the Firebase console directly, or upload from code using the
   helper in `src/utils/firestore.js`:

   ```js
   import { addItem } from "./utils/firestore";

   // software collection example
   addItem("software", {
     name: "My App",
     description: "A neat utility",
     url: "https://example.com/my-app",
   });
   ```

   The helper will validate the object against the appropriate Zod schema
   before attempting to write it; an exception is thrown if the data doesn't
   conform, which makes it easy to catch typos or missing fields during
   development.

### Authentication & uploads

A `/login` route provides a simple email/password form powered by Firebase
Authentication. After a successful sign‑in the user is redirected to
`/dashboard`.

The dashboard page exposes a file picker and optional name/description; when
submitted the image is uploaded to a GitHub repository using the REST API and
then a Firestore document is added to the `photography` collection with the
raw `raw.githubusercontent.com` URL.

To enable uploads you must set additional environment variables:

```env
REACT_APP_GITHUB_TOKEN=<personal-access-token>
REACT_APP_GITHUB_OWNER=<your-github-username-or-org>
REACT_APP_GITHUB_REPO=<repo-name>
REACT_APP_GITHUB_BRANCH=main    # optional, defaults to main
```

The token should have `repo` scopes (at least `contents:write`). You can
create one at https://github.com/settings/tokens.

Once configured, navigate to `/login`, sign in with a Firebase user, and visit
`/dashboard` to upload images. They will automatically appear on the
`/photography` listing after the Firestore doc is created.
On the dashboard you'll also see a list of existing photographs; each entry
has a **Delete** button. Clicking it will remove the Firestore document and,
if the document contains a `path` field, also attempt to delete the
corresponding file from GitHub. Earlier uploads created before this field was
added may not have a `path`, in which case the Firestore entry will be deleted
but you'll need to remove the file yourself via the GitHub UI or API. The
`path` is stored alongside the document during upload and looks like
`photography/1619123456789_filename.jpg`.

When you choose a file to upload, the form will attempt to extract metadata
from the image using the `exifr` library. If the photo contains a creation
timestamp, camera model or GPS coordinates, those values will be filled into
the appropriate inputs automatically. You can still override them manually
before submitting.

#### Obtaining a GitHub token

1. Log in to GitHub and go to [Settings → Developer settings → Personal access
   tokens](https://github.com/settings/tokens).
2. Click **"Generate new token"**, give it a descriptive name (e.g. "photo
   uploader").
3. Under **Scopes**, check **repo** (full control of repositories) or at least
   the narrower `contents:write` permission to allow file uploads.
4. Generate the token and copy it; this is the value you put in
   `REACT_APP_GITHUB_TOKEN` in your `.env` file. Treat it like a password and do
   not commit it; the `.gitignore` already excludes `.env`.

With the token, owner, repo and branch specified in `.env`, the dashboard can
push image files directly to your GitHub repository and store the resulting raw
URL in Firestore.
Feel free to keep the old `src/config/images.json` file for reference or remove it entirely.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
