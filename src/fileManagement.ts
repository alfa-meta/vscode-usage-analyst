import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import * as vscode from "vscode";

export const dataFilePath = path.join(
    process.env.HOME || process.env.USERPROFILE || "./",
    ".vscodeUsageStats.json"
);

function getDefaultShell(): string {
    const platform = os.platform();
    try {
        const shell =
        platform === "win32" ? process.env.COMSPEC || "cmd.exe" : process.env.SHELL || "/bin/bash";
        return shell;
    } catch (error) {
        console.error("Error determining default shell:", error);
        return "cmd.exe"; // Fallback to cmd.exe for Windows
    }
}

function getCurrentUser(): string {
    let username: string;

    // For Windows
    if (process.platform === 'win32') {
        username = process.env.USERNAME || '';
    } 
    // For Linux and macOS
    else {
        username = process.env.USER || os.userInfo().username;
    }

    return username;
}
  

export function saveCurrentSessionStatstoTotalUsageStats(){
    usageStats.totalGitCommits += currentSessionUsageStats.currentNumberOfCommits;
    usageStats.totalKeyStrokes += currentSessionUsageStats.currentNumberOfKeyStrokes;
    usageStats.totalFilesOpened += currentSessionUsageStats.currentFilesOpened;
    usageStats.totalNumberOfSelectedText += currentSessionUsageStats.currentNumberOfSelectedText;
    usageStats.totalSecondsWhilstWindowIsFocused += currentSessionUsageStats.currentSecondsWhilstWindowIsFocused;
    usageStats.totalSecondsOutsideVSCode += currentSessionUsageStats.currentSecondsOutsideVSCode;
    usageStats.totalSecondsWhilstVSCodeIsActive += currentSessionUsageStats.currentSecondsWhilstVSCodeIsActive;

    //Reset values to default
    currentSessionUsageStats.currentNumberOfCommits = 0;
    currentSessionUsageStats.currentNumberOfKeyStrokes = 0;
    currentSessionUsageStats.currentFilesOpened = 0;
    currentSessionUsageStats.currentNumberOfSelectedText = 0;
    currentSessionUsageStats.currentSecondsWhilstWindowIsFocused = 0;
    currentSessionUsageStats.currentSecondsOutsideVSCode = 0;
    currentSessionUsageStats.currentSecondsWhilstVSCodeIsActive = 0;
}

export function saveStatsToFile() {
    saveCurrentSessionStatstoTotalUsageStats();
    fs.writeFileSync(dataFilePath, JSON.stringify(usageStats, null, 2));
}
  
export function loadStatsFromFile() {
    try {
        if (fs.existsSync(dataFilePath)) {
            const data = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
            Object.assign(usageStats, data);
            Object.assign(currentSessionUsageStats, data)

        }
    } catch (error) {
        console.error("Error loading usage stats:", error);
    }
}

export function createNewSessionStats(): SessionUsageStats {
    return currentSessionUsageStats; // Copies default values
}

export interface UsageStats {
    installedExtensions: vscode.Extension<any>[],
    userInstalledExtensions: string[],
    numberOfInstalledExtensions: number,
    cpuUsageByVSCode: string,
    memoryUsageByVSCode: string,
    operatingSystem: string;
    currentShell: string;
    currentUser: string;
    currentGitBranch: string;
    listOfGitBranches: string[];
    totalGitCommits: number;
    lastGitWarningTime: number;
    mostRecentGitCommitTime: number;
    mostRecentGitCommitMessage: string;
    showGitWarning: boolean;
    totalKeyStrokes: number;
    totalFilesOpened: number;
    totalNumberOfSelectedText: number;
    totalSecondsWhilstWindowIsFocused: number;
    totalSecondsOutsideVSCode: number;
    totalSecondsWhilstVSCodeIsActive: number;
}

export const usageStats: UsageStats = {
    installedExtensions: [],
    userInstalledExtensions: [],
    numberOfInstalledExtensions: 0,
    cpuUsageByVSCode: "",
    memoryUsageByVSCode: "",
    operatingSystem: os.type(),
    currentShell: getDefaultShell(),
    currentUser: getCurrentUser(),
    currentGitBranch: "None",
    listOfGitBranches: [],
    totalGitCommits: 0,
    lastGitWarningTime: 0,
    mostRecentGitCommitTime: 0,
    mostRecentGitCommitMessage: "",
    showGitWarning: true,
    totalKeyStrokes: 0,
    totalFilesOpened: 0,
    totalNumberOfSelectedText: 0,
    totalSecondsWhilstWindowIsFocused: 0,
    totalSecondsOutsideVSCode: 0,
    totalSecondsWhilstVSCodeIsActive: 0,
};

export interface SessionUsageStats {
    currentNumberOfCommits: number,
    currentNumberOfKeyStrokes: number,
    currentFilesOpened: number,
    currentNumberOfSelectedText: number,
    currentSecondsWhilstWindowIsFocused: number,
    currentSecondsOutsideVSCode: number,
    currentSecondsWhilstVSCodeIsActive: number,
};

export const currentSessionUsageStats: SessionUsageStats = {
    currentNumberOfCommits: 0,
    currentNumberOfKeyStrokes: 0,
    currentFilesOpened: 0,
    currentNumberOfSelectedText: 0,
    currentSecondsWhilstWindowIsFocused: 0,
    currentSecondsOutsideVSCode: 0,
    currentSecondsWhilstVSCodeIsActive: 0,
};