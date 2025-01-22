import * as path from "path";
import * as fs from "fs";
import * as os from "os";

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

export interface UsageStats {
    currentGitBranch: string;
    listOfGitBranches: string[];
    totalGitCommits: number;
    lastGitWarningTime: number;
    showGitWarning: boolean;
    totalKeyStrokes: number;
    totalFilesOpened: number;
    totalSelections: number;
    totalSecondsWhilstWindowIsFocused: number;
    totalSecondsOutsideVSCode: number;
    totalSecondsWhilstVSCodeIsActive: number;
    operatingSystem: string;
}

export const usageStats: UsageStats = {
    currentGitBranch: "None",
    listOfGitBranches: [],
    totalGitCommits: 0,
    lastGitWarningTime: 0,
    showGitWarning: true,
    totalKeyStrokes: 0,
    totalFilesOpened: 0,
    totalSelections: 0,
    totalSecondsWhilstWindowIsFocused: 0,
    totalSecondsOutsideVSCode: 0,
    totalSecondsWhilstVSCodeIsActive: 0,
    operatingSystem: os.type(),
};