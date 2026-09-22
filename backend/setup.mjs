import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
const password = randomBytes(24).toString("base64url");
try {
  await writeFile(
    new URL("../.env", import.meta.url),
    `PORT=3000\nAPP_ORIGIN=http://localhost:3000\nADMIN_PASSWORD=${password}\nDATABASE_PATH=backend/data/portfolio.sqlite\nNODE_ENV=development\nTRUST_PROXY=0\n`,
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    `Created .env. Keep it private.\nAdmin inbox: http://localhost:3000/admin\nYour generated admin password: ${password}\n\nStart with npm start.`,
  );
} catch (e) {
  if (e.code === "EEXIST")
    console.log(".env already exists. Existing settings were preserved.");
  else throw e;
}
