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
    operatingSystem: string;
    currentGitBranch: string;
    listOfGitBranches: string[];
    totalGitCommits: number;
    lastGitWarningTime: number;
    mostRecentGitCommitTime: number;
    mostRecentGitCommitMessage: string;
    showGitWarning: boolean;
    totalKeyStrokes: number;
    totalWords: number;
    totalFilesOpened: number;
    totalNumberOfSelectedText: number;
    totalSecondsWhilstWindowIsFocused: number;
    totalSecondsOutsideVSCode: number;
    totalSecondsWhilstVSCodeIsActive: number;
}

export const usageStats: UsageStats = {
    operatingSystem: os.type(),
    currentGitBranch: "None",
    listOfGitBranches: [],
    totalGitCommits: 0,
    lastGitWarningTime: 0,
    mostRecentGitCommitTime: 0,
    mostRecentGitCommitMessage: "",
    showGitWarning: true,
    totalKeyStrokes: 0,
    totalWords: 0,
    totalFilesOpened: 0,
    totalNumberOfSelectedText: 0,
    totalSecondsWhilstWindowIsFocused: 0,
    totalSecondsOutsideVSCode: 0,
    totalSecondsWhilstVSCodeIsActive: 0,
};

export function createNewSessionStats(): UsageStats {
    const currentSessionUsageStats: UsageStats = { ...usageStats };
    return currentSessionUsageStats; // Copies default values
}