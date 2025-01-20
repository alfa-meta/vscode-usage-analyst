import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

const usageStats = {
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

class UsageOverviewProvider implements vscode.TreeDataProvider<UsageItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<UsageItem | undefined | void> = new vscode.EventEmitter<UsageItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<UsageItem | undefined | void> = this._onDidChangeTreeData.event;

  getTreeItem(element: UsageItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: UsageItem): Thenable<UsageItem[]> {
    if (!element) {
      return Promise.resolve([
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

  let isFocused = true; // Track whether the window is focused
  const interval = setInterval(() => {
    if (isFocused) {
      usageStats.totalSeconds += 1;
      usageOverviewProvider.refresh(); // Refresh tree view
    }
  }, 1000);

  const usageOverviewProvider = new UsageOverviewProvider();
  vscode.window.registerTreeDataProvider("usageOverview", usageOverviewProvider);

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

  const gitExtension = vscode.extensions.getExtension("vscode.git");
  if (gitExtension) {
    gitExtension.activate().then(() => {
      const api = gitExtension.exports.getAPI(1);
  
      api.repositories.forEach((repository: any) => {
        let previousCommit = repository.state.HEAD?.commit; // Track the previous HEAD commit
  
        repository.state.onDidChange(() => {
          const currentCommit = repository.state.HEAD?.commit;
          console.log("Am I HERE?")
  
          // Increment only if a new commit is detected (currentCommit changes)
          if (currentCommit && currentCommit !== previousCommit) {
            usageStats.totalGitCommits++;
            usageOverviewProvider.refresh();
            previousCommit = currentCommit; // Update the previous commit
          }
        });
      });
    });
  }
  
  

  // context.subscriptions.push(disposableKeyPresses);
  // context.subscriptions.push(disposableKeystrokes);
  // context.subscriptions.push(disposableFilesOpened);
  // context.subscriptions.push(disposableSelections);
  // context.subscriptions.push(disposableWindowState);
  context.subscriptions.push(disposableKeyPresses, disposableKeystrokes, disposableFilesOpened, disposableSelections, disposableWindowState, {
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
