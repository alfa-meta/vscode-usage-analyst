# VSCode Usage Stats Extension

This extension tracks your usage patterns in VSCode, providing insights into your productivity by monitoring keystrokes, file interactions, Git usage, and more.

## Features

- **Real-time Git Tracking**:
  - Detect current Git branch.
  - Fetch all branches.
  - Count total Git commits.
  - Display the most recent commit time and message.

- **Session and Total Usage Stats**:
  - Keystrokes count.
  - Files opened.
  - Selected text count.
  - Time spent in VSCode, outside VSCode, and while VSCode is active.

- **Operating System Compatibility**:
  - Tracks active applications on Windows, Linux, and macOS.

- **Tree View Overview**:
  - Displays usage stats categorized under Operating System Info, Git Info, Text Info, Time Info, and Active Applications.

## How to Install

1. Clone this repository:
   ```bash
   git clone <repository_url>
   ```

2. Open the folder in VSCode.

3. Install dependencies:
   ```bash
   npm install
   ```

4. Launch the extension:
   - Press `F5` to open a new Extension Development Host window.

## How to Use

1. Open a project in VSCode.
2. The extension automatically begins tracking stats like:
   - Keystrokes
   - Files opened
   - Git activity
   - Time spent in VSCode

3. View the stats in the "Usage Overview" tree view in the Explorer sidebar.

## Configuration

- Disable Git Warnings:
  - Click "Don't show again" when prompted about missing Git repositories.

## Commands

The extension does not currently support custom commands. All stats are tracked automatically.

## Development Notes

- Stats are saved to a JSON file:
  - **Path:** `$HOME/.vscodeUsageStats.json` (or the equivalent on your OS).

- **Key Files**:
  - `gitManagement.ts`: Handles Git-related operations.
  - `fileManagement.ts`: Manages stats storage and retrieval.
  - `usageOverviewProvider.ts`: Implements the Tree View UI.

## Known Issues

- Occasional duplicate tracking of file interactions due to `.git`-specific file events.
- Active application tracking uses platform-specific logic and may require optimization.

## Contributing

1. Fork the repository.
2. Create a new branch for your feature/bug fix.
3. Submit a pull request with a detailed description.

## License

This extension is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## References

- [VSCode Extension API Documentation](https://code.visualstudio.com/api)
- [Node.js File System Module](https://nodejs.org/api/fs.html)
- [Git Commands](https://git-scm.com/docs)
