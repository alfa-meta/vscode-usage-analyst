import * as vscode from "vscode";
import * as cp from "child_process";

function getWorkspacePath(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

export function isGitRepository(): boolean {
  try {
    cp.execSync("git rev-parse --is-inside-work-tree", {
      cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
    });
    return true;
  } catch {
    vscode.window.showWarningMessage("The current workspace is not a Git repository.");
    return false;
  }
}

export function getCurrentGitBranch(): string {
  if (!isGitRepository()) {
    return "Not a Git repository";
  }

  try {
    const branch = cp.execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
    }).toString().trim();
    return branch;
  } catch (error) {
    console.error("Error getting current Git branch:", error);
    return "Unknown";
  }
}

export function getCurrentGitCommitValue(): number {
  if (!isGitRepository()) {
    return 0;
  }

  try {
    const output = cp.execSync("git rev-list --count HEAD", {
      cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
    }).toString().trim();
    return parseInt(output, 10);
  } catch (error) {
    console.error("Error counting commits:", error);
    return 0;
  }
}

export function getGitBranches(): string[] {
    if (!isGitRepository()) {
      console.error("Not a Git repository.");
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
  