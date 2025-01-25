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

function updateMostRecentGitCommitDetails() {
  exec('git log -1 --pretty=format:"%ct,%s"', { cwd: vscode.workspace.rootPath }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error fetching latest Git commit: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Git stderr: ${stderr}`);
      return;
    }

    const [commitTime, commitMessage] = stdout.split(",", 2);
    if (commitTime && commitMessage) {
      usageStats.mostRecentGitCommitTime = parseInt(commitTime, 10); // UNIX timestamp
      usageStats.mostRecentGitCommitMessage = commitMessage.trim();
    }
  });
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


function windowsCheckActiveApplication(){
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

function linuxCheckActiveApplication() {
  // Command to list all running graphical applications
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

    // Parse active applications
    activeApplications = stdout
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line); // Remove empty lines
  });
}




class UsageOverviewProvider implements vscode.TreeDataProvider<UsageItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<UsageItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  getTreeItem(element: UsageItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: UsageItem): Thenable<UsageItem[]> {
    const usageItemTestRow: UsageItem[] = [];
    const usageItemTestItem: UsageItem[] = [new UsageItem("Testing")];
    usageItemTestRow.push(new UsageItem("Test Row", usageItemTestItem, vscode.TreeItemCollapsibleState.Collapsed));


    const masterUsageItemCollapsableTreeArray: UsageItem[] = [];
    const operatingSystemUsageTreeItemsArray: UsageItem[] = [
      new UsageItem("Operating System: " + usageStats.operatingSystem)
    ];
    const gitInfoTreeItemsArray: UsageItem[] = [
      new UsageItem("Current Git Branch: " + usageStats.currentGitBranch),
      new UsageItem("All Git Branches:"),
      ...usageStats.listOfGitBranches.map((branch) => new UsageItem("  - " + branch)),
      new UsageItem("Git Commits: " + usageStats.totalGitCommits),
      new UsageItem(
        "Most Recent Commit Time: "
      ),
      new UsageItem(new Date(usageStats.mostRecentGitCommitTime * 1000).toLocaleString()),
      new UsageItem("Most Recent Commit Message: "),
      new UsageItem(
        usageStats.mostRecentGitCommitMessage
      )
    ];


    const totalTextInfoSubTreeItemsArray: UsageItem[] = [
      new UsageItem("Keystrokes: " + usageStats.totalKeyStrokes),
      new UsageItem("Files Opened: " + usageStats.totalFilesOpened),
      new UsageItem("Selections: " + usageStats.totalNumberOfSelectedText),
    ];


    const textInfoTreeItemsArray: UsageItem[] = [
      new UsageItem("Current", totalTextInfoSubTreeItemsArray, vscode.TreeItemCollapsibleState.Expanded),
      new UsageItem("Total", totalTextInfoSubTreeItemsArray, vscode.TreeItemCollapsibleState.Collapsed),
    ];

    const totalTimeInfoSubTreeItemsArray: UsageItem[] = [
      new UsageItem("Time Spent: " + formatTime(usageStats.totalSecondsWhilstWindowIsFocused)),
      new UsageItem("Time Spent outside of VSCode: " + formatTime(usageStats.totalSecondsOutsideVSCode)),
      new UsageItem("Time Spent whilst VSCode is active: " + formatTime(usageStats.totalSecondsWhilstVSCodeIsActive)),
    ];

    const timeInfoTreeItemsArray: UsageItem[] = [
      new UsageItem("Current", totalTimeInfoSubTreeItemsArray, vscode.TreeItemCollapsibleState.Expanded),
      new UsageItem("Total", totalTimeInfoSubTreeItemsArray, vscode.TreeItemCollapsibleState.Collapsed),
    ];

    masterUsageItemCollapsableTreeArray.push(new UsageItem("Operating System Info", operatingSystemUsageTreeItemsArray, vscode.TreeItemCollapsibleState.Collapsed))
    masterUsageItemCollapsableTreeArray.push(new UsageItem("Git Info", gitInfoTreeItemsArray, vscode.TreeItemCollapsibleState.Collapsed))
    masterUsageItemCollapsableTreeArray.push(new UsageItem("Text Info", textInfoTreeItemsArray, vscode.TreeItemCollapsibleState.Collapsed))
    masterUsageItemCollapsableTreeArray.push(new UsageItem("Time Info", timeInfoTreeItemsArray, vscode.TreeItemCollapsibleState.Collapsed))
    masterUsageItemCollapsableTreeArray.push(new UsageItem("Active Applications", activeApplications.map(app => new UsageItem("  - " + app)), vscode.TreeItemCollapsibleState.Collapsed))

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
let isKeyEventProcessing: boolean = false; // Flag to prevent double increment


export function activate(context: vscode.ExtensionContext) {
  loadStatsFromFile();
  const gitExtension = vscode.extensions.getExtension("vscode.git");
  let isFocused = true; // Track whether the window is focused
  const usageOverviewProvider = new UsageOverviewProvider();
  const editor = vscode.window.activeTextEditor;
  let debounceTimeout: NodeJS.Timeout;
  vscode.window.registerTreeDataProvider("usageOverview", usageOverviewProvider);

  const interval = setInterval(() => {
    if (isFocused) {
      usageStats.currentGitBranch = getCurrentGitBranch(usageStats);
      usageStats.listOfGitBranches = getGitBranches(usageStats); // Fetch all branches
      usageStats.totalGitCommits = getCurrentGitCommitValue(usageStats);
      updateMostRecentGitCommitDetails(); // Fetch most recent commit details
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

  const disposableSelections = vscode.window.onDidChangeTextEditorSelection((event) => {
    // Clear any existing timeout to debounce the event
    clearTimeout(debounceTimeout);

    // Set a timeout to execute the code after a delay
    debounceTimeout = setTimeout(() => {
      let totalSelectedLines = 0;
      let combinedSelectedText = ""; // Accumulate all selected text here

      event.selections.forEach((selection) => {
          const selectedText = event.textEditor.document.getText(selection); // Get the selected text
          combinedSelectedText += selectedText; // Append to the combined text
          totalSelectedLines += selection.end.line - selection.start.line + 1; // Include the last line
      });

      console.log(`Final Selected Text: "${combinedSelectedText}"`);
      console.log(`Length of selected text: ${combinedSelectedText.length}`);

      if (totalSelectedLines > 0) {
          usageStats.totalNumberOfSelectedText += combinedSelectedText.length;
          console.log(`Total lines selected: ${totalSelectedLines}`);
          usageOverviewProvider.refresh();
      }
    }, 200); // Delay of 200ms (adjust as needed)
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
