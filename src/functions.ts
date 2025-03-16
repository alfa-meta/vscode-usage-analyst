import { execSync } from "child_process";
import * as os from "os";

export function formatTime(seconds: number) {
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

export function getOSTypeAndVersion() {
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
      const macVersion = execSync("sw_vers -productVersion", {
        encoding: "utf8",
      }).trim();
      operatingSystem = `Apple macOS, Version: ${macVersion}`;
      break;
    }
    case "Linux": {
      try {
        // Terminal Command
        const linuxDistro = execSync(
          "cat /etc/os-release | grep '^PRETTY_NAME=' | cut -d= -f2",
          { encoding: "utf8" }
        ).replace(/(^\"|\"$|\n)/g, "");
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
