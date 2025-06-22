/**
 * Script to fix authentication imports across all API routes
 * This script identifies and fixes common authentication issues:
 * 1. Wrong authOptions import path
 * 2. Missing authOptions parameter in getServerSession calls
 * 3. Inconsistent authentication patterns
 */

const fs = require("fs");
const path = require("path");

// Configuration
const API_DIR = "./src/app/api";
const CORRECT_AUTH_IMPORT = "@/app/api/auth/[...nextauth]/route";
const WRONG_AUTH_IMPORT = "@/lib/auth";

// Files that have authentication issues based on the search results
const FILES_TO_FIX = [
  "src/app/api/services/[id]/route.ts",
  "src/app/api/submissions/[id]/route.ts",
  "src/app/api/services/route.ts",
  "src/app/api/admin/region-admins/route.ts",
  "src/app/api/admin/fix-schema/route.ts",
  "src/app/api/admin/submissions/[id]/update-form/route.ts",
  "src/app/api/admin/run-script/route.ts",
  "src/app/api/admin/submissions/route.ts",
  "src/app/api/payment/refund/route.ts",
  "src/app/api/auth/update-password/route.ts",
  "src/app/api/auth/update-profile/route.ts",
  "src/app/api/payment/transactions/route.ts",
  "src/app/api/payment/transaction/route.ts",
  "src/app/api/admin/interactions/route.ts",
  "src/app/api/submissions/identification/route.ts",
  "src/app/api/submissions/address/route.ts",
  "src/app/api/submissions/bank-details/route.ts",
  "src/app/api/submissions/reply/route.ts",
  "src/app/api/submissions/interactions/route.ts",
  "src/app/api/submissions/permanent-info/route.ts",
  "src/app/api/admin/create-region-admin/route.ts",
];

function fixAuthImports(filePath) {
  try {
    console.log(`\n🔧 Fixing: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    // Fix 1: Replace wrong authOptions import
    const wrongImportPattern =
      /import\s*{\s*([^}]*authOptions[^}]*)\s*}\s*from\s*["']@\/lib\/auth["'];?/g;
    if (wrongImportPattern.test(content)) {
      content = content.replace(wrongImportPattern, (match, imports) => {
        console.log(`  ✅ Fixed authOptions import`);
        modified = true;
        return `import { ${imports} } from "${CORRECT_AUTH_IMPORT}";`;
      });
    }

    // Fix 2: Add authOptions parameter to getServerSession calls that are missing it
    const getServerSessionPattern = /getServerSession\(\s*\)/g;
    if (getServerSessionPattern.test(content)) {
      content = content.replace(
        getServerSessionPattern,
        "getServerSession(authOptions)"
      );
      console.log(`  ✅ Added authOptions parameter to getServerSession calls`);
      modified = true;
    }

    // Fix 3: Ensure authOptions is imported if getServerSession is used
    if (
      content.includes("getServerSession") &&
      !content.includes("authOptions")
    ) {
      // Add authOptions import
      const importPattern =
        /import\s*{\s*([^}]*)\s*}\s*from\s*["']next-auth["'];?/;
      if (importPattern.test(content)) {
        content = content.replace(importPattern, (match, imports) => {
          console.log(`  ✅ Added authOptions import`);
          modified = true;
          return `${match}\nimport { authOptions } from "${CORRECT_AUTH_IMPORT}";`;
        });
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`  ✅ Successfully updated ${filePath}`);
      return true;
    } else {
      console.log(`  ℹ️  No changes needed for ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function generateSummaryReport(results) {
  console.log("\n📊 SUMMARY REPORT");
  console.log("==================");

  const fixed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`✅ Successfully fixed: ${fixed} files`);
  console.log(`❌ Failed to fix: ${failed} files`);

  if (failed > 0) {
    console.log("\n❌ Failed files:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.file}`);
      });
  }

  console.log("\n📝 Next Steps:");
  console.log("1. Review the changes made to ensure they are correct");
  console.log("2. Test the authentication flow on your server");
  console.log("3. Deploy the changes to production");
  console.log("4. Monitor server logs for authentication issues");
}

function main() {
  console.log("🚀 Starting Authentication Import Fix Script");
  console.log(`📁 Target directory: ${API_DIR}`);
  console.log(`🔄 Fixing ${FILES_TO_FIX.length} files`);

  const results = [];

  FILES_TO_FIX.forEach((filePath) => {
    const success = fixAuthImports(filePath);
    results.push({ file: filePath, success });
  });

  generateSummaryReport(results);

  console.log("\n🎉 Authentication fix script completed!");
}

// Run the script
main();
