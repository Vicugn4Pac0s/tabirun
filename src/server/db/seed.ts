import "dotenv/config";
import { db } from "./index";
import { paces } from "./schema";

async function seed() {
  await db.insert(paces).values([
    { value: "3:00" },
    { value: "3:10" },
    { value: "3:20" },
    { value: "3:30" },
    { value: "3:40" },
    { value: "3:50" },
    { value: "4:00" },
    { value: "4:10" },
    { value: "4:20" },
    { value: "4:30" },
    { value: "4:40" },
    { value: "4:50" },
    { value: "5:00" },
    { value: "5:10" },
    { value: "5:20" },
    { value: "5:30" },
    { value: "5:40" },
    { value: "5:50" },
    { value: "6:00" },
    { value: "6:10" },
    { value: "6:20" },
    { value: "6:30" },
    { value: "6:40" },
    { value: "6:50" },
    { value: "7:00" },
    { value: "7:10" },
    { value: "7:20" },
    { value: "7:30" },
    { value: "7:40" },
    { value: "7:50" },
    { value: "8:00" },
    { value: "8:10" },
    { value: "8:20" },
    { value: "8:30" },
    { value: "8:40" },
    { value: "8:50" },
    { value: "9:00" },
    { value: "9:10" },
    { value: "9:20" },
    { value: "9:30" },
    { value: "9:40" },
    { value: "9:50" },
    { value: "10:00" }
  ]);

  console.log("✅ Seed 完了");
}

seed().catch(console.error);