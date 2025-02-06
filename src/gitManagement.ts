import {UsageStats} from "./fileManagement";
import * as vscode from "vscode";
import * as cp from "child_process";

function getWorkspacePath(): string | undefined {
  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    console.error("No workspace is open.");
    return undefined;
  }
  return vscode.workspace.workspaceFolders[0].uri.fsPath;
}


export function isGitRepository(usageStats: UsageStats): boolean {
  const workspacePath = getWorkspacePath();
  if (!workspacePath) {
    console.error("Workspace path is undefined or invalid.");
    return false;
  }

  // This only returns true if UsageStats.showGitWarning is False
  if (!usageStats.showGitWarning){
    return true;
  }

  try {
    cp.execSync("git rev-parse --is-inside-work-tree", {
      cwd: workspacePath, // Use the validated workspace path
      shell: usageStats.currentShell,
    });
    return true;
  } catch (error: any) {
    console.error("Git command failed:", error.message);
    const now = Date.now();
    if (now - usageStats.lastGitWarningTime > 30000) {
      vscode.window
        .showInformationMessage(
          "The current workspace is not a Git repository.",
          "Don't show again"
        )
        .then((selection) => {
          if (selection === "Don't show again") {
            usageStats.showGitWarning = false;
          }
        });

      usageStats.lastGitWarningTime = now;
    }
    return false;
  }
}



export function getCurrentGitBranch(usageStats: UsageStats): string {
  if (!isGitRepository(usageStats)) {
    return "Not a Git repository";
  }

  try {
    const branch = cp.execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
      shell: usageStats.currentShell,
    }).toString().trim();
    return branch;
  } catch (error) {
    console.error("Error getting current Git branch:", error);
    return "Unknown";
  }
}

export function getCurrentGitCommitValue(usageStats: UsageStats): number {
  if (!isGitRepository(usageStats)) {
    return 0;
  }

  try {
    const output = cp.execSync("git rev-list --count HEAD", {
      cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
      shell: usageStats.currentShell,
    }).toString().trim();
    return parseInt(output, 10);
  } catch (error) {
    console.error("Error counting commits:", error);
    return 0;
  }
}

export function getGitBranches(usageStats: UsageStats): string[] {
    if (!isGitRepository(usageStats)) {
      console.error("Could not get Git Branches, not a Git repository.");
      return [];
    }
  
    try {
      const workspacePath = getWorkspacePath();
      if (!workspacePath) {
        console.error("No workspace path available.");
        return [];
      }
  
      const result = cp.execSync("git branch --all", {
        cwd: workspacePath,
        shell: usageStats.currentShell,
        encoding: "utf-8",
      });
  
      return result
        .split("\n")
        .map(branch => branch.trim())
        .filter(branch => branch);
    } catch (error) {
      console.error("Error fetching branches:", error);
      return [];
    }
  }
  