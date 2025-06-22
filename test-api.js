const fetch = require("node-fetch");

async function testAPI() {
  try {
    console.log("Testing region admin API...");

    // Test the region admin API endpoint
    const response = await fetch(
      "http://localhost:3001/api/admin/submissions?page=1&limit=10&isRegionAdmin=true",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers.raw());

    const data = await response.text();
    console.log("Response body:", data);
  } catch (error) {
    console.error("Error testing API:", error);
  }
}

testAPI();
