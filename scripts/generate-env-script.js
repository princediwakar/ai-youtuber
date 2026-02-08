const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const scriptPath = path.join(__dirname, "apply-env.sh");

if (!fs.existsSync(envPath)) {
  console.error(".env.local not found!");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const envLines = envContent.split("\n");

const IGNORED_KEYS = [
  "NODE_ENV",
  "NEXTAUTH_URL", // Handled separately
  "localhost",
  "127.0.0.1",
];

let scriptContent = `#!/bin/bash
# Syncs valid secrets from .env.local to Vercel Production
# Generated automatically

echo "Syncing environment variables to Vercel Production..."

# Ensure vercel is logged in
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI not found. Please install it with 'npm i -g vercel' first."
    exit 1
fi
\n`;

// Add special handling for NEXTAUTH_URL
scriptContent += `echo "Setting NEXTAUTH_URL..."\n`;
scriptContent += `printf "https://aiyoutuber.vercel.app" | vercel env add NEXTAUTH_URL production\n\n`;

for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;

  let [key, ...valueParts] = trimmed.split("=");
  let value = valueParts.join("=");

  // Remove quotes if present
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }

  if (IGNORED_KEYS.includes(key)) continue;

  // Escape special chars for shell
  // Using simplified escaping for bash 'printf'
  // Single quotes are tricky.
  const escapedValue = value.replace(/'/g, "'\\''");

  scriptContent += `echo "Setting ${key}..."\n`;
  scriptContent += `printf '%s' '${escapedValue}' | vercel env add ${key} production\n`;
}

scriptContent += `\necho "✅ Environment synchronization complete!"\n`;

fs.writeFileSync(scriptPath, scriptContent);
fs.chmodSync(scriptPath, "755");

console.log(`Generated sync script at: ${scriptPath}`);
