/**
 * File Handler Utilities
 * Manages temporary file cleanup (privacy-first approach)
 */

import fs from "fs/promises";
import path from "path";

export async function cleanupFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log(`✓ Deleted file: ${filePath}`);
  } catch (error) {
    console.warn(`Failed to delete file ${filePath}:`, error.message);
  }
}

export async function cleanupOldFiles(directory, maxAgeMinutes = 30) {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      const ageMinutes = (now - stats.mtimeMs) / (1000 * 60);

      if (ageMinutes > maxAgeMinutes) {
        await cleanupFile(filePath);
      }
    }
  } catch (error) {
    console.warn("Cleanup error:", error.message);
  }
}

export function isValidCSV(filename) {
  return filename.toLowerCase().endsWith(".csv");
}
