const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../circuits/target/zk_password.json");

try {
  const raw = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(raw);

  if (json.file_map) {
    for (const key in json.file_map) {
      if (json.file_map[key].path) {
        json.file_map[key].path = "";
      }
    }
  }

  if (json.debug_symbols) {
    delete json.debug_symbols;
  }

  if (Array.isArray(json.brillig_names) && json.brillig_names.length === 0) {
    delete json.brillig_names;
  }

  fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
  console.log("✅ zk_password.json cleaned successfully");
} catch (err) {
  console.error("❌ Failed to clean zk_password.json:", err.message);
}
