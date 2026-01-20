/**
 * YAML Loader
 * 
 * Loads and parses YAML files
 */

const fs = require('fs');
const yaml = require('js-yaml');

function loadYaml(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return yaml.load(content);
  } catch (e) {
    console.error(`Error parsing YAML file ${filePath}: ${e.message}`);
    process.exit(1);
  }
}

module.exports = {
  loadYaml
};
