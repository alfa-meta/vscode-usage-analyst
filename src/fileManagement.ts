import * as path from "path";
import * as fs from "fs";

export const dataFilePath = path.join(
    process.env.HOME || process.env.USERPROFILE || "./",
    ".vscodeUsageStats.json"
  );
  
export function saveStatsToFile() {
    fs.writeFileSync(dataFilePath, JSON.stringify(usageStats, null, 2));
}
  
export function loadStatsFromFile() {
    try {
        if (fs.existsSync(dataFilePath)) {
        const data = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
        Object.assign(usageStats, data);
        }
    } catch (error) {
        console.error("Error loading usage stats:", error);
    }
}

interface UsageStats {
    currentGitBranch: string;
    listOfGitBranches: string[];
    totalGitCommits: number;
    totalKeyStrokes: number;
    totalFilesOpened: number;
    totalSelections: number;
    totalSeconds: number;
}

export const usageStats: UsageStats = {
    currentGitBranch: "None",
    listOfGitBranches: [],
    totalGitCommits: 0,
    totalKeyStrokes: 0,
    totalFilesOpened: 0,
    totalSelections: 0,
    totalSeconds: 0,
};