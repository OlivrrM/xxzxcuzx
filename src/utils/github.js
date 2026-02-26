// utility for interacting with GitHub repository contents via the REST API
// environment variables must supply credentials and target information:
//   REACT_APP_GITHUB_TOKEN
//   REACT_APP_GITHUB_OWNER
//   REACT_APP_GITHUB_REPO
//   REACT_APP_GITHUB_BRANCH (defaults to "main")

async function api(path, options = {}) {
  const token = process.env.REACT_APP_GITHUB_TOKEN;
  const owner = process.env.REACT_APP_GITHUB_OWNER;
  const repo = process.env.REACT_APP_GITHUB_REPO;

  if (!token || !owner || !repo) {
    throw new Error('GitHub configuration missing in environment variables');
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
    path,
  )}`;
  const headers = {
    Authorization: `token ${token}`,
    'Content-Type': 'application/json',
  };

  const resp = await fetch(url + (options.query || ''), {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GitHub request failed: ${resp.status} ${text}`);
  }

  return resp.json();
}

export async function uploadFileToGitHub(file, path) {
  // read file content as base64
  const arrayBuffer = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  const base64 = btoa(binary);

  await api(path, {
    method: 'PUT',
    body: JSON.stringify({
      message: `add photo ${path}`,
      content: base64,
      branch: process.env.REACT_APP_GITHUB_BRANCH || 'main',
    }),
  });

  return `https://raw.githubusercontent.com/${process.env.REACT_APP_GITHUB_OWNER}/${process.env.REACT_APP_GITHUB_REPO}/${process.env.REACT_APP_GITHUB_BRANCH || 'main'}/${path}`;
}

export async function deleteFileFromGitHub(path) {
  // get current file metadata to obtain SHA
  const info = await api(path, {
    query: `?ref=${process.env.REACT_APP_GITHUB_BRANCH || 'main'}`,
  });
  const sha = info.sha;
  await api(path, {
    method: 'DELETE',
    body: JSON.stringify({
      message: `delete photo ${path}`,
      sha,
      branch: process.env.REACT_APP_GITHUB_BRANCH || 'main',
    }),
  });
}
