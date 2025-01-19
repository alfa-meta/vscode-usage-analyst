import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let totalKeyStrokes = 0; // To count keystrokes
  let totalFilesOpened = 0; // To count files opened
  let totalSelections = 0; // To count text selections
  let totalSeconds = 0; // To track total time spent

  let isFocused = true; // Track whether the window is focused
  const interval = setInterval(() => {
    if (isFocused) {
      totalSeconds += 1;
    }
  }, 1000);

  // Track keystrokes
  const disposableKeystrokes = vscode.workspace.onDidChangeTextDocument(
    (event) => {
      totalKeyStrokes += event.contentChanges.length;
    }
  );

  // Track file open events
  const disposableFilesOpened = vscode.workspace.onDidOpenTextDocument(() => {
    totalFilesOpened += 1;
  });

  // Track text selections
  const disposableSelections = vscode.window.onDidChangeTextEditorSelection(
    () => {
      totalSelections += 1;
    }
  );

  // Track window focus/blur for accurate timing
  const disposableWindowState = vscode.window.onDidChangeWindowState(
    (state) => {
      isFocused = state.focused;
    }
  );

  // Register a command to show a webview panel
  const disposableAnalyst = vscode.commands.registerCommand(
    "vscode-usage-analyst.analyst",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "usageOverview",
        "Usage Overview",
        vscode.ViewColumn.One,
        {
          enableScripts: true, // Enable JavaScript in the webview
        }
      );
  
      panel.webview.html = getWebviewContent();
  
      // Handle messages from the webview
      panel.webview.onDidReceiveMessage((message) => {
        if (message.command === "getStats") {
          panel.webview.postMessage({
            keys: totalKeyStrokes,
            files: totalFilesOpened,
            selections: totalSelections,
            time: totalSeconds,
          });
        }
      });
    }
  );
  

  // Push disposables to context subscriptions
  context.subscriptions.push(disposableKeystrokes);
  context.subscriptions.push(disposableFilesOpened);
  context.subscriptions.push(disposableSelections);
  context.subscriptions.push(disposableWindowState);
  context.subscriptions.push(disposableAnalyst);

  // Clean up the interval when the extension is deactivated
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
