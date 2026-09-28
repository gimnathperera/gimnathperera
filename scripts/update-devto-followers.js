// Fetches the DEV.to follower count and writes it into README.md
// between the DEVTO-FOLLOWERS markers. Run by .github/workflows/devto-followers.yml.

const fs = require('node:fs');
const path = require('node:path');

const README_PATH = path.join(__dirname, '..', 'README.md');
const START = '<!-- DEVTO-FOLLOWERS:START -->';
const END = '<!-- DEVTO-FOLLOWERS:END -->';
const PER_PAGE = 1000; // API maximum
const PROFILE_URL = 'https://dev.to/gimnathperera';

async function fetchFollowerCount(apiKey) {
  let total = 0;

  for (let page = 1; ; page++) {
    const res = await fetch(
      `https://dev.to/api/followers/users?page=${page}&per_page=${PER_PAGE}`,
      { headers: { 'api-key': apiKey, accept: 'application/vnd.forem.api-v1+json' } },
    );
    if (!res.ok) {
      throw new Error(`DEV.to API responded ${res.status} ${res.statusText}`);
    }

    const followers = await res.json();
    total += followers.length;
    if (followers.length < PER_PAGE) return total;
  }
}

function renderBadge(count) {
  const label = `${count.toLocaleString('en-US')} followers`;
  const badge = `https://img.shields.io/badge/dev.to-${encodeURIComponent(label)}-0A0A0A?style=for-the-badge&logo=devdotto&logoColor=white`;
  return `[![Dev.to](${badge})](${PROFILE_URL})`;
}

function updateReadme(readme, count) {
  const pattern = new RegExp(`${START}[\\s\\S]*?${END}`);
  if (!pattern.test(readme)) {
    throw new Error(`Markers ${START} / ${END} not found in README.md`);
  }
  return readme.replace(pattern, `${START}${renderBadge(count)}${END}`);
}

async function main() {
  const apiKey = process.env.DEVTO_API_KEY;
  if (!apiKey) throw new Error('DEVTO_API_KEY is not set');

  const count = await fetchFollowerCount(apiKey);
  const readme = fs.readFileSync(README_PATH, 'utf8');
  fs.writeFileSync(README_PATH, updateReadme(readme, count));
  console.log(`DEV.to followers: ${count}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { renderBadge, updateReadme };
