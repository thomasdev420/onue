const fs = require('fs');
const { execSync } = require('child_process');

// Read the current version from package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const currentVersion = packageJson.version;

// Parse the version number
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Function to format version number with proper padding
function formatVersion(major, minor, patch) {
  return `${major}.${minor.toString().padStart(1, '0')}.${patch.toString().padStart(1, '0')}`;
}

// Calculate new version
let newVersion;
if (patch < 9) {
  // Increment patch (2.4.0 -> 2.4.1)
  newVersion = formatVersion(major, minor, patch + 1);
} else if (minor < 9) {
  // Increment minor and reset patch (2.4.9 -> 2.5.0)
  newVersion = formatVersion(major, minor + 1, 0);
} else {
  // Increment major and reset minor and patch (2.9.9 -> 3.0.0)
  newVersion = formatVersion(major + 1, 0, 0);
}

// Update package.json with the new version
packageJson.version = newVersion;
fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));

// Create a new tag
const tagName = `v${newVersion}`;
const commitMessage = `chore: bump version to ${newVersion}`;

try {
  // Add the modified package.json
  execSync('git add package.json');
  
  // Create a new commit
  execSync(`git commit -m "${commitMessage}"`);
  
  // Create and push the new tag
  execSync(`git tag -a ${tagName} -m "Version ${newVersion}"`);
  execSync(`git push origin ${tagName}`);
  
  console.log(`Successfully created and pushed tag ${tagName}`);
} catch (error) {
  console.error('Error creating tag:', error.message);
  process.exit(1);
} 