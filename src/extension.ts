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

  const disposableKeyPresses = vscode.window.onDidChangeTextEditorSelection(() => {
    usageStats.totalKeyStrokes++;
  });

  const disposableKeystrokes = vscode.workspace.onDidChangeTextDocument((event) => {
    usageStats.totalKeyStrokes += event.contentChanges.length;
  });

  const disposableFilesOpened = vscode.workspace.onDidOpenTextDocument(() => {
    usageStats.totalFilesOpened += 1;
  });

  const disposableSelections = vscode.window.onDidChangeTextEditorSelection(() => {
    usageStats.totalSelections += 1;
  });

  const disposableWindowState = vscode.window.onDidChangeWindowState((state) => {
    isFocused = state.focused;
  });

  const usageOverviewProvider = new UsageOverviewProvider();
  vscode.window.registerTreeDataProvider("usageOverview", usageOverviewProvider);

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

function getWebviewContent() {
  // HTML content for the webview
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Usage Overview</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 10px;
        }
        h1 {
          color: #007acc;
        }
        .stat {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <h1>Usage Overview</h1>
      <div class="stat"><strong>Keys Pressed:</strong> <span id="keys">0</span></div>
      <div class="stat"><strong>Files Opened:</strong> <span id="files">0</span></div>
      <div class="stat"><strong>Text Selections:</strong> <span id="selections">0</span></div>
      <div class="stat"><strong>Time Spent:</strong> <span id="time">0s</span></div>
      <script>
        const vscode = acquireVsCodeApi();
        window.onload = () => {
          setInterval(() => {
            vscode.postMessage({ command: "getStats" });
          }, 1000);
        };

        window.addEventListener("message", (event) => {
          const stats = event.data;
          document.getElementById("keys").innerText = stats.keys;
          document.getElementById("files").innerText = stats.files;
          document.getElementById("selections").innerText = stats.selections;
          document.getElementById("time").innerText = stats.time;
        });
      </script>
    </body>
    </html>
  `;
}
