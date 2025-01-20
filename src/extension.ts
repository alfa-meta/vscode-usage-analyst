import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as cp from "child_process";

const usageStats = {
  currentGitBranch: "None",
  totalKeyStrokes: 0,
  totalFilesOpened: 0,
  totalSelections: 0,
  totalGitCommits: 0,
  totalSeconds: 0,
};

const dataFilePath = path.join(
  process.env.HOME || process.env.USERPROFILE || "./",
  ".vscodeUsageStats.json"
);

function saveStatsToFile() {
  fs.writeFileSync(dataFilePath, JSON.stringify(usageStats, null, 2));
}

function loadStatsFromFile() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
      Object.assign(usageStats, data);
    }
  } catch (error) {
    console.error("Error loading usage stats:", error);
  }
}

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

function getCurrentGitBranch(): string {
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

class UsageOverviewProvider implements vscode.TreeDataProvider<UsageItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<UsageItem | undefined | void> = new vscode.EventEmitter<UsageItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<UsageItem | undefined | void> = this._onDidChangeTreeData.event;

  getTreeItem(element: UsageItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: UsageItem): Thenable<UsageItem[]> {
    if (!element) {
      return Promise.resolve([
        new UsageItem("Current Git Branch: " + usageStats.currentGitBranch),
        new UsageItem("Keystrokes: " + usageStats.totalKeyStrokes),
        new UsageItem("Files Opened: " + usageStats.totalFilesOpened),
        new UsageItem("Selections: " + usageStats.totalSelections),
        new UsageItem("Git Commits: " + usageStats.totalGitCommits),
        new UsageItem("Time Spent: " + formatTime(usageStats.totalSeconds)),
      ]);
    }
    return Promise.resolve([]);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

class UsageItem extends vscode.TreeItem {
  constructor(label: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
  }
}

export function activate(context: vscode.ExtensionContext) {
  loadStatsFromFile();
  const gitExtension = vscode.extensions.getExtension("vscode.git");
  let isFocused = true; // Track whether the window is focused
  const usageOverviewProvider = new UsageOverviewProvider();
  vscode.window.registerTreeDataProvider("usageOverview", usageOverviewProvider);

  const interval = setInterval(() => {
    if (isFocused) {
      usageStats.currentGitBranch = getCurrentGitBranch();
      usageStats.totalSeconds += 1;
      usageOverviewProvider.refresh();
    }
  }, 1000);

  const disposableKeyPresses = vscode.window.onDidChangeTextEditorSelection(() => {
    usageStats.totalKeyStrokes++;
    usageOverviewProvider.refresh();
  });

  const disposableKeystrokes = vscode.workspace.onDidChangeTextDocument((event) => {
    usageStats.totalKeyStrokes += event.contentChanges.length;
    usageOverviewProvider.refresh();
  });

  const disposableFilesOpened = vscode.workspace.onDidOpenTextDocument(() => {
    usageStats.totalFilesOpened++;
    usageOverviewProvider.refresh();
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
