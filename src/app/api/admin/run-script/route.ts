import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execPromise = promisify(exec);

// This is a special API endpoint to run scripts
// It should only be accessible to admins
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the script name from the query parameters
    const url = new URL(req.url);
    const script = url.searchParams.get("script");

    if (!script) {
      return NextResponse.json(
        { error: "Script name is required" },
        { status: 400 }
      );
    }

    // Validate the script name to prevent command injection
    const validScripts = ["update-user-schema", "fix-user-model"];
    if (!validScripts.includes(script)) {
      return NextResponse.json(
        { error: "Invalid script name" },
        { status: 400 }
      );
    }

    // Get the project root directory
    const projectRoot = process.cwd();

    // Build the script path
    const scriptPath = path.join(projectRoot, "src", "scripts", `${script}.js`);

    // Run the script
    const { stdout, stderr } = await execPromise(`node ${scriptPath}`);

    // Return the result
    return NextResponse.json({
      success: true,
      message: `Script ${script} executed successfully`,
      output: stdout || stderr,
    });
  } catch (error: any) {
    console.error("Error running script:", error);
    return NextResponse.json(
      { error: error.message || "Failed to run script" },
      { status: 500 }
    );
  }
}
