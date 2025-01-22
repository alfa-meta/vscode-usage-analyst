import * as vscode from "vscode";
import { exec } from "child_process";

import { getCurrentGitBranch, getCurrentGitCommitValue, getGitBranches } from "./gitManagement";
import { saveStatsToFile, loadStatsFromFile, usageStats } from "./fileManagement";

function formatTime(seconds: number) {
  const years = Math.floor(seconds / (365 * 24 * 60 * 60));
  seconds %= 365 * 24 * 60 * 60;
  const weeks = Math.floor(seconds / (7 * 24 * 60 * 60));
  seconds %= 7 * 24 * 60 * 60;
  const days = Math.floor(seconds / (24 * 60 * 60));
  seconds %= 24 * 60 * 60;
  const hours = Math.floor(seconds / (60 * 60));
  seconds %= 60 * 60;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;

  const parts = [];
  if (years > 0) parts.push(`${years}y`);
  if (weeks > 0) parts.push(`${weeks}w`);
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.join(" ");
}

function checkActiveApplications(){
  // Run the ListActiveApps logic every second
  const powershellCommand = "Get-Process | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object Name";

  exec(`powershell.exe -Command "${powershellCommand}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error fetching active apps: ${error.message}`);
      return;
    }

    if (stderr) {
      console.error(`Stderr while fetching active apps: ${stderr}`);
      return;
    }

    // Parse active applications
    activeApplications = stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && line !== "Name" && !line.startsWith("----")); // Remove empty lines, headers, and separators
  });
}



class UsageOverviewProvider implements vscode.TreeDataProvider<UsageItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<UsageItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  getTreeItem(element: UsageItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: UsageItem): Thenable<UsageItem[]> {
    if (!element) {
      return Promise.resolve([
        new UsageItem("Git Info", [
          new UsageItem("Current Git Branch: " + usageStats.currentGitBranch),
          new UsageItem("All Git Branches:"),
              ...usageStats.listOfGitBranches.map(branch => new UsageItem("  - " + branch)),
          new UsageItem("Git Commits: " + usageStats.totalGitCommits),
        ], vscode.TreeItemCollapsibleState.Collapsed),
        new UsageItem("Text Info", [
          new UsageItem("Keystrokes: " + usageStats.totalKeyStrokes),
          new UsageItem("Files Opened: " + usageStats.totalFilesOpened),
          new UsageItem("Selections: " + usageStats.totalSelections),
        ], vscode.TreeItemCollapsibleState.Collapsed),
        new UsageItem("Time Info", [
          new UsageItem("Time Spent: " + formatTime(usageStats.totalSecondsWhilstWindowIsFocused)),
          new UsageItem("Time Spent outside of VSCode: " + formatTime(usageStats.totalSecondsOutsideVSCode)),
          new UsageItem("Time Spent whilst VSCode is active: " + formatTime(usageStats.totalSecondsWhilstVSCodeIsActive)),
        ], vscode.TreeItemCollapsibleState.Collapsed),
        new UsageItem("Active Applications", activeApplications.map(app => new UsageItem("  - " + app)), vscode.TreeItemCollapsibleState.Collapsed),
      ]);
    }
    return Promise.resolve(element.children || []);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

class UsageItem extends vscode.TreeItem {
  children: UsageItem[] | undefined;

  constructor(label: string, children?: UsageItem[], collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None) {
    super(label, collapsibleState);
    this.children = children;
  }
}

// Global Variables
const openedFiles = new Set<string>();
let activeApplications: string[] = [];
let isKeyEventProcessing: boolean = false; // Flag to prevent double increment


export function activate(context: vscode.ExtensionContext) {
  loadStatsFromFile();
  const gitExtension = vscode.extensions.getExtension("vscode.git");
  let isFocused = true; // Track whether the window is focused
  const usageOverviewProvider = new UsageOverviewProvider();
  vscode.window.registerTreeDataProvider("usageOverview", usageOverviewProvider);

  const interval = setInterval(() => {
    if (isFocused) {
      usageStats.currentGitBranch = getCurrentGitBranch();
      usageStats.listOfGitBranches = getGitBranches(); // Fetch all branches
      usageStats.totalGitCommits = getCurrentGitCommitValue();
      usageStats.totalSecondsWhilstWindowIsFocused += 1;
    } else {
      usageStats.totalSecondsOutsideVSCode += 1;
    }
    usageStats.totalSecondsWhilstVSCodeIsActive = usageStats.totalSecondsOutsideVSCode + usageStats.totalSecondsWhilstWindowIsFocused
    usageOverviewProvider.refresh();

    checkActiveApplications()
  }, 1000);

  const disposableKeyPresses = vscode.workspace.onDidChangeTextDocument((event) => {
    const totalChanges = event.contentChanges.reduce((acc, change) => {
      // Sum up the length of text changes (insertions + deletions)
      return acc + Math.abs(change.text.length);
    }, 0);
  
    if (isKeyEventProcessing && totalChanges > 0) {
      usageStats.totalKeyStrokes++; // Increment keystrokes by 1 for each user action
      usageOverviewProvider.refresh();
    }
  });

  const disposableKeystrokes = vscode.workspace.onDidChangeTextDocument((event) => {
    usageStats.totalKeyStrokes += event.contentChanges.length;
    usageOverviewProvider.refresh();
  });

  const disposableFilesOpened = vscode.workspace.onDidOpenTextDocument((document) => {
    const filePath = document.uri.fsPath;
  
    /*
    * The reason why it checks for the .git fileName, is due to a bug in vscode extension api.
    * The api returns two files a .git version of the same file and a regular string of the fileName.
    */

    if (!document.fileName.endsWith('.git')) {
      openedFiles.add(filePath); // Track the file as opened
      usageStats.totalFilesOpened++;
      usageOverviewProvider.refresh();
    }
  });

  const disposableFilesClosed = vscode.workspace.onDidCloseTextDocument((document) => {
    const filePath = document.uri.fsPath;
    openedFiles.delete(filePath);
  });

  const disposableSelections = vscode.window.onDidChangeTextEditorSelection(() => {
    usageStats.totalSelections++;
    usageOverviewProvider.refresh();
  });

  const disposableWindowState = vscode.window.onDidChangeWindowState((state) => {
    isFocused = state.focused;
  });

  context.subscriptions.push(
    disposableKeyPresses,
    disposableKeystrokes,
    disposableFilesOpened,
    disposableFilesClosed,
    disposableSelections,
    disposableWindowState,
    {
      dispose: () => {
        clearInterval(interval);
        saveStatsToFile();
        console.log("Extension deactivated, stats saved.");
      },
    }
  );
}

export function deactivate() {
  saveStatsToFile();
}
