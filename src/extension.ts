import * as vscode from "vscode";

const usageStats = {
  totalKeyStrokes: 0,
  totalFilesOpened: 0,
  totalSelections: 0,
  totalSeconds: 0,
};

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
        new UsageItem("Time Spent: " + usageStats.totalSeconds + "s"),
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
  let isFocused = true; // Track whether the window is focused
  const interval = setInterval(() => {
    if (isFocused) {
      usageStats.totalSeconds += 1;
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

  context.subscriptions.push(disposableKeyPresses);
  context.subscriptions.push(disposableKeystrokes);
  context.subscriptions.push(disposableFilesOpened);
  context.subscriptions.push(disposableSelections);
  context.subscriptions.push(disposableWindowState);
  context.subscriptions.push({
    dispose: () => clearInterval(interval),
  });
}

export function deactivate() {
  // Clean up resources (if necessary)
}