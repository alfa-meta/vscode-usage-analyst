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

function checkActiveApplications() {
  switch (usageStats.operatingSystem) {
    case "Windows_NT":
      windowsCheckActiveApplication();
      break;
    case "Linux":
      linuxCheckActiveApplication();
      break;
    case "Darwin":
      linuxCheckActiveApplication();
      break;
    default:
      console.error(`Unsupported operating system: ${usageStats.operatingSystem}`);
  }
}

function windowsCheckActiveApplication() {
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

    activeApplications = stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && line !== "Name" && !line.startsWith("----"));
  });
}

function linuxCheckActiveApplication() {
  const command = `ps -eo comm | grep -E "^[^\\[]+" | sort | uniq`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error fetching active apps: ${error.message}`);
      return;
    }

    if (stderr) {
      console.error(`Stderr while fetching active apps: ${stderr}`);
      return;
    }

    activeApplications = stdout
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
  });
}

class UsageOverviewProvider implements vscode.TreeDataProvider<UsageItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<UsageItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  getTreeItem(element: UsageItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: UsageItem): Thenable<UsageItem[]> {
    const masterUsageItemCollapsableTreeArray: UsageItem[] = [];
    const operatingSystemUsageTreeItemsArray: UsageItem[] = [
      new UsageItem("Operating System: " + usageStats.operatingSystem)
    ];
    const gitInfoTreeItemsArray: UsageItem[] = [
      new UsageItem("Current Git Branch: " + usageStats.currentGitBranch),
      new UsageItem("All Git Branches:"),
      ...usageStats.listOfGitBranches.map(branch => new UsageItem("  - " + branch)),
      new UsageItem("Git Commits: " + usageStats.totalGitCommits),
    ];
    const textInfoTreeItemsArray: UsageItem[] = [
      new UsageItem("Keystrokes: " + usageStats.totalKeyStrokes),
      new UsageItem("Files Opened: " + usageStats.totalFilesOpened),
      new UsageItem("Selections: " + usageStats.totalSelections),
    ];
    const timeInfoTreeItemsArray: UsageItem[] = [
      new UsageItem("Time Spent: " + formatTime(usageStats.totalSecondsWhilstWindowIsFocused)),
      new UsageItem("Time Spent outside of VSCode: " + formatTime(usageStats.totalSecondsOutsideVSCode)),
      new UsageItem("Time Spent whilst VSCode is active: " + formatTime(usageStats.totalSecondsWhilstVSCodeIsActive)),
    ];

    masterUsageItemCollapsableTreeArray.push(new UsageItem("Operating System Info", operatingSystemUsageTreeItemsArray, vscode.TreeItemCollapsibleState.Collapsed));
    masterUsageItemCollapsableTreeArray.push(new UsageItem("Git Info", gitInfoTreeItemsArray, vscode.TreeItemCollapsibleState.Collapsed));
    masterUsageItemCollapsableTreeArray.push(new UsageItem("Text Info", textInfoTreeItemsArray, vscode.TreeItemCollapsibleState.Collapsed));
    masterUsageItemCollapsableTreeArray.push(new UsageItem("Time Info", timeInfoTreeItemsArray, vscode.TreeItemCollapsibleState.Collapsed));
    masterUsageItemCollapsableTreeArray.push(new UsageItem("Active Applications", activeApplications.map(app => new UsageItem("  - " + app)), vscode.TreeItemCollapsibleState.Collapsed));

    if (!element) {
      return Promise.resolve(masterUsageItemCollapsableTreeArray);
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
let isKeyEventProcessing: boolean = false;

export function activate(context: vscode.ExtensionContext) {
  loadStatsFromFile();
  const usageOverviewProvider = new UsageOverviewProvider();
  vscode.window.registerTreeDataProvider("usageOverview", usageOverviewProvider);

  const interval = setInterval(() => {
    usageStats.currentGitBranch = getCurrentGitBranch(usageStats);
    usageStats.listOfGitBranches = getGitBranches(usageStats);
    usageStats.totalGitCommits = getCurrentGitCommitValue(usageStats);
    usageStats.totalSecondsWhilstWindowIsFocused++;
    usageOverviewProvider.refresh();

    checkActiveApplications();
  }, 1000);

  context.subscriptions.push({
    dispose: () => {
      clearInterval(interval);
      saveStatsToFile();
      console.log("Extension deactivated, stats saved.");
    },
  });
}

export function deactivate() {
  saveStatsToFile();
}
