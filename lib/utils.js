/**
 * Utils — Shared helpers for JSON parsing and validation
 */
import fs from 'fs';
import path from 'path';

/**
 * Safely parse a JSON file, throwing a descriptive error on failure.
 * @param {string} filePath - Absolute path to the JSON file.
 * @returns {*} Parsed JSON value.
 */
export function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    throw new Error(`Failed to parse ${path.basename(filePath)}: ${e.message}`);
  }
}

/**
 * Validate a module name, rejecting any value that could be used for path traversal.
 * A valid name must be a non-empty, single path segment with no separators or `..`.
 * @param {string} name - The module name to validate.
 * @throws {Error} If the name is invalid.
 */
export function validateModuleName(name) {
  if (!name || name !== path.basename(name) || name.includes('..')) {
    throw new Error(`Invalid module name: "${name}"`);
  }
}
