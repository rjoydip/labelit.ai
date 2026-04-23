#!/usr/bin/env bun

/**
 * Code Quality Dashboard Script
 * Generates a summary of code quality metrics and combines coverage reports
 */

import { existsSync, mkdirSync, readdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const log = (message: string) => console.log(message);
const logSection = (title: string) => {
  log(`\n🔹 ${title}`);
  log("─".repeat(50));
};

const runCommand = async (command: string, description: string): Promise<void> => {
  log(`🔧 ${description}...`);
  try {
    const proc = Bun.spawn(["bun", "run", command], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const { stdout, stderr, exitCode } = await proc;

    if (exitCode === 0) {
      log(`✅ ${description} completed successfully`);
      if (stdout.toString().trim()) {
        log(`Output:\n${stdout}`);
      }
    } else {
      log(`⚠️  ${description} completed with exit code ${exitCode}`);
      if (stderr.toString().trim()) {
        log(`Error output:\n${stderr}`);
      }
    }
  } catch (error) {
    log(`❌ Failed to run ${description}: ${error}`);
  }
  log(""); // Empty line for spacing
};

const copyCoverageReports = (): void => {
  logSection("Combining Coverage Reports");
  const servicesCoverageDir = join(__dirname, "..", "packages", "services", "coverage");
  const rootCoverageDir = join(__dirname, "..", "coverage");

  if (!existsSync(servicesCoverageDir)) {
    log("📄 No services coverage directory found.");
    return;
  }

  // Create root coverage directory if it doesn't exist
  if (!existsSync(rootCoverageDir)) {
    mkdirSync(rootCoverageDir, { recursive: true });
    log(`📁 Created root coverage directory: ${rootCoverageDir}`);
  }

  try {
    const files = readdirSync(servicesCoverageDir);
    if (files.length === 0) {
      log("📄 Services coverage directory is empty.");
      return;
    }

    log(`📁 Copying coverage reports from ${servicesCoverageDir} to ${rootCoverageDir}`);
    files.forEach((file) => {
      const source = join(servicesCoverageDir, file);
      const dest = join(rootCoverageDir, file);

      // Skip directories, only copy files
      if (existsSync(source)) {
        const stats = Bun.file(source).size >= 0 ? { isFile: () => true } : null;
        // Simple check: if it's not a directory, copy it
        log(`Status: ${stats}`);
        try {
          const sourceStat = Bun.file(source);
          // If we can get metadata, it's likely a file
          copyFileSync(source, dest);
          log(`  ✅ Copied: ${file} and it's stats: ${sourceStat}`);
        } catch {
          // If it's a directory, skip it
          if (file !== "src") {
            // Only log warning for non-src directories
            log(`  ⚠️  Skipped directory: ${file}`);
          }
        }
      }
    });

    // Also copy the src directory contents if it exists
    const srcDir = join(servicesCoverageDir, "src");
    const destSrcDir = join(rootCoverageDir, "src");
    if (existsSync(srcDir)) {
      if (!existsSync(destSrcDir)) {
        mkdirSync(destSrcDir, { recursive: true });
      }
      const srcFiles = readdirSync(srcDir);
      log(`  📁 Copying src directory contents...`);
      srcFiles.forEach((file) => {
        const sourceFile = join(srcDir, file);
        const destFile = join(destSrcDir, file);
        try {
          copyFileSync(sourceFile, destFile);
          log(`    ✅ Copied: src/${file}`);
        } catch (e) {
          log(`    ⚠️  Could not copy src/${file}: ${e}`);
        }
      });
    }

    log(`🎉 Coverage reports combined successfully in: ${rootCoverageDir}`);
  } catch (error) {
    log(`⚠️  Error combining coverage reports: ${error}`);
  }
};

const openCoverageReport = (): void => {
  logSection("Opening Coverage Report");
  const coverageDir = join(__dirname, "..", "coverage");
  const indexHtml = join(coverageDir, "index.html");

  if (!existsSync(indexHtml)) {
    log("📄 No index.html found in coverage directory.");
    return;
  }

  try {
    // Try to open with the default browser on Windows
    if (process.platform === "win32") {
      // Use the default Windows way to open files
      Bun.spawn(["cmd", "/c", "start", "", indexHtml]);
    } else if (process.platform === "darwin") {
      Bun.spawn(["open", indexHtml]);
    } else {
      Bun.spawn(["xdg-open", indexHtml]);
    }
    log(`🌐 Opening coverage report: ${indexHtml}`);
  } catch (error) {
    log(`⚠️  Could not open browser automatically. Please open manually: ${indexHtml}`);
    log(`   Error: ${error}`);
  }
};

const main = async () => {
  log("🔍 Labelit.ai Code Quality Dashboard");
  log("====================================");

  // Check if we're in the right directory
  if (!existsSync("package.json")) {
    log("❌ Error: package.json not found. Please run from repository root.");
    process.exit(1);
  }

  // Run tests with coverage
  await runCommand("test:coverage", "Running tests with coverage");

  // Run type check
  await runCommand("typecheck", "Running type check");

  // Run lint
  await runCommand("lint", "Running lint");

  // Combine coverage reports
  copyCoverageReports();

  // Open coverage report
  openCoverageReport();

  log("");
  log("✅ Dashboard complete!");
  log("");
  log("📝 Notes:");
  log("- For detailed test results, check the test output above");
  log("- For linting details, run: bun run lint");
  log("- For type checking details, run: bun run typecheck");
  log("- Combined coverage reports are available in the root coverage/ directory");
};

main().catch((error) => {
  log(`❌ Dashboard failed: ${error.message}`);
  process.exit(1);
});
