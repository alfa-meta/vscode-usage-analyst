import * as vscode from "vscode";
import * as cp from "child_process";

export function isGitRepository(): boolean {
  try {
    cp.execSync("git rev-parse --is-inside-work-tree", {
      cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
    });
    return true;
  } catch {
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