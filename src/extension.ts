import { exec, execSync } from "child_process";
import * as vscode from "vscode";
import * as os from "os";
import process from "process";

import { getCurrentGitBranch, getCurrentGitCommitValue, getGitBranches } from "./gitManagement";
import { saveStatsToFile, loadStatsFromFile, usageStats, currentSessionUsageStats } from "./fileManagement";



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

function getVSCodeUserInstalledExtensions() {
  // Get the list of installed extensions
  const installedExtensions = vscode.extensions.all;

  // Filter out built-in extensions
  const userInstalledExtensions = installedExtensions.filter(extension => {
    const osType = os.type();
    let isBuiltIn;

    // Built-in extensions are typically located in the VS Code installation directory
    if (osType === "Windows_NT") {
      isBuiltIn = extension.extensionPath.includes('resources\\app\\extensions');
    } else {
      isBuiltIn = extension.extensionPath.includes('resources/app/extensions');
    }

    return !isBuiltIn;
  });

  return userInstalledExtensions;
}


function updateMostRecentGitCommitDetails() {
  // Terminal Command
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

function getOSTypeAndVersion() {
  const osType = os.type();
  let operatingSystem;

  switch (osType) {
    case "Windows_NT": {
      const windowsVersion = os.release();
      operatingSystem = `Microsoft Windows, Version: ${windowsVersion}`;
      break;
    }
    case "Darwin": {
      // Terminal Command
      const macVersion = execSync("sw_vers -productVersion", { encoding: "utf8" }).trim();
      operatingSystem = `Apple macOS, Version: ${macVersion}`;
      break;
    }
    case "Linux": {
      try {
        // Terminal Command
        const linuxDistro = execSync("cat /etc/os-release | grep '^PRETTY_NAME=' | cut -d= -f2", { encoding: "utf8" })
          .replace(/(^\"|\"$|\n)/g, "");
        operatingSystem = `Linux, Distribution: ${linuxDistro}`;
      } catch (error) {
        operatingSystem = "Linux";
      }
        break;
    }
    default: {
      console.error(`Unsupported operating system: ${osType}`);
      operatingSystem = `Unsupported operating system: ${osType}`;
    }
  }
  return operatingSystem;
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
  // Terminal Command
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
  // Terminal Command
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
    const masterUsageItemCollapsableTreeArray: UsageItem[] = [];

    const userInstalledExtensionsUsageItemArray: UsageItem[] = 
      usageStats.userInstalledExtensions.map(ext => new UsageItem(" - " + ext));

    const generalInfoTreeItemsArray: UsageItem[] = [
      // new UsageItem("VSCode CPU Usage: " + usageStats.cpuUsageByVSCode),
      // new UsageItem("VSCode Memory Usage: " + usageStats.memoryUsageByVSCode),
      new UsageItem("Number of Extensions: " + usageStats.numberOfInstalledExtensions),
      new UsageItem("Current Installed Extensions", userInstalledExtensionsUsageItemArray, vscode.TreeItemCollapsibleState.Collapsed),
    ];

    const operatingSystemUsageTreeItemsArray: UsageItem[] = [
      new UsageItem("Operating System: " + getOSTypeAndVersion()),
      new UsageItem("Current Shell: " + usageStats.currentShell),
      new UsageItem("Current User: " + usageStats.currentUser)
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

    const currentTextInfoSubTreeItemsArray: UsageItem[] = [
      new UsageItem("Keystrokes: " + currentSessionUsageStats.currentNumberOfKeyStrokes),
      new UsageItem("Files Opened: " + currentSessionUsageStats.currentFilesOpened),
      new UsageItem("Selections: " + currentSessionUsageStats.currentNumberOfSelectedText),
    ];

    const totalTextInfoSubTreeItemsArray: UsageItem[] = [
      new UsageItem("Keystrokes: " + usageStats.totalKeyStrokes),
      new UsageItem("Files Opened: " + usageStats.totalFilesOpened),
      new UsageItem("Selections: " + usageStats.totalNumberOfSelectedText),
    ];

    const textInfoTreeItemsArray: UsageItem[] = [
      new UsageItem("Current", currentTextInfoSubTreeItemsArray, vscode.TreeItemCollapsibleState.Expanded),
      new UsageItem("Total", totalTextInfoSubTreeItemsArray, vscode.TreeItemCollapsibleState.Collapsed),
    ];

    const currentTimeInfoSubTreeItemsArray: UsageItem[] = [
      new UsageItem("Time Spent: " + formatTime(currentSessionUsageStats.currentSecondsWhilstWindowIsFocused)),
      new UsageItem("Time Spent outside of VSCode: " + formatTime(currentSessionUsageStats.currentSecondsOutsideVSCode)),
      new UsageItem("Time Spent whilst VSCode is active: " + formatTime(currentSessionUsageStats.currentSecondsWhilstVSCodeIsActive)),
    ];

    const totalTimeInfoSubTreeItemsArray: UsageItem[] = [
      new UsageItem("Time Spent: " + formatTime(usageStats.totalSecondsWhilstWindowIsFocused)),
      new UsageItem("Time Spent outside of VSCode: " + formatTime(usageStats.totalSecondsOutsideVSCode)),
      new UsageItem("Time Spent whilst VSCode is active: " + formatTime(usageStats.totalSecondsWhilstVSCodeIsActive)),
    ];

    const timeInfoTreeItemsArray: UsageItem[] = [
      new UsageItem("Current", currentTimeInfoSubTreeItemsArray, vscode.TreeItemCollapsibleState.Expanded),
      new UsageItem("Total", totalTimeInfoSubTreeItemsArray, vscode.TreeItemCollapsibleState.Collapsed),
    ];

    masterUsageItemCollapsableTreeArray.push(new UsageItem("General Info", generalInfoTreeItemsArray, vscode.TreeItemCollapsibleState.Collapsed))
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
      const extensionList: string[] = [];
      usageStats.installedExtensions = getVSCodeUserInstalledExtensions();
      // Needs optimising
      usageStats.installedExtensions.forEach(extension => {
        const extensionString = `${extension.packageJSON.displayName || extension.id}`;
        // console.log(`Extension ID: ${extension.id}, Name: ${extension.packageJSON.displayName || extension.id}`);
        extensionList.push(extensionString);
      });
      usageStats.userInstalledExtensions = extensionList;
      usageStats.currentGitBranch = getCurrentGitBranch(usageStats);
      usageStats.listOfGitBranches = getGitBranches(usageStats); // Fetch all branches
      usageStats.totalGitCommits = getCurrentGitCommitValue(usageStats);
      updateMostRecentGitCommitDetails(); // Fetch most recent commit details
      currentSessionUsageStats.currentSecondsWhilstWindowIsFocused += 1;
      usageStats.numberOfInstalledExtensions = usageStats.installedExtensions.length;
    } else {
      currentSessionUsageStats.currentSecondsOutsideVSCode += 1;
    }
    currentSessionUsageStats.currentSecondsWhilstVSCodeIsActive = currentSessionUsageStats.currentSecondsOutsideVSCode + currentSessionUsageStats.currentSecondsWhilstWindowIsFocused
    usageOverviewProvider.refresh();

    checkActiveApplications()
  }, 1000);

  const disposableKeyPresses = vscode.workspace.onDidChangeTextDocument((event) => {
    const totalChanges = event.contentChanges.reduce((acc, change) => {
      // Sum up the length of text changes (insertions + deletions)
      return acc + Math.abs(change.text.length);
    }, 0);
  
    if (isKeyEventProcessing && totalChanges > 0) {
      currentSessionUsageStats.currentNumberOfKeyStrokes++; // Increment keystrokes by 1 for each user action
      usageOverviewProvider.refresh();
    }
  });

  const disposableKeystrokes = vscode.workspace.onDidChangeTextDocument((event) => {
    currentSessionUsageStats.currentNumberOfKeyStrokes += event.contentChanges.length;
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
      currentSessionUsageStats.currentFilesOpened++;
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
  
    // Use a static variable to track the last selection length
    let lastSelectionLength = 0;
  
    debounceTimeout = setTimeout(() => {
      let totalSelectedTextLength = 0;
  
      // Calculate the length of all selected text
      event.selections.forEach((selection) => {
        const selectedText = event.textEditor.document.getText(selection); // Get the selected text
        totalSelectedTextLength += selectedText.length;
      });
  
      // Check if the new selection length is different from the last
      if (totalSelectedTextLength !== lastSelectionLength) {
        // Update the stat only with the delta
        const delta = totalSelectedTextLength - lastSelectionLength;
        currentSessionUsageStats.currentNumberOfSelectedText += Math.max(delta, 0);
        lastSelectionLength = totalSelectedTextLength; // Update last known length
        usageOverviewProvider.refresh();
      }
    }, 200); // Delay of 200ms
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
