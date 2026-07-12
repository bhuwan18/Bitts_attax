import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const sources = [
  ["cheerio:corinthian-seller-matchattax-2025", "2024/25 main"],
  ["cheerio:corinthian-seller-matchattax-2026", "2025/26 main"],
  ["cheerio:corinthian-seller-matchattax-extra-2026", "Extra 2026"],
  ["cheerio:corinthian-seller-matchattax-extra-2025", "Extra 2025"],
  ["cheerio:corinthian-seller-matchattax-2024", "2023/24 main"],
  ["cheerio:corinthian-seller-matchattax-extra-2024", "Extra 2024"],
  ["cheerio:corinthian-seller-matchattax-2023", "2022/23 main"],
  ["cheerio:corinthian-seller-matchattax-extra-2023", "Extra 2023"],
  ["cheerio:corinthian-seller-matchattax-2022", "2021/22 main"],
  ["cheerio:corinthian-seller-matchattax-extra-2022", "Extra 2022"],
  ["cheerio:corinthian-seller-topps-premier-league-2026", "Topps Premier League 2026"],
  ["cheerio:corinthian-seller-topps-ucc-superstars-2024", "Topps UCC Superstars 2024"],
];

let total = 0;
const rows = [];
for (const [source, label] of sources) {
  const { count } = await supabase
    .from("cards")
    .select("*", { count: "exact", head: true })
    .eq("source", source);
  rows.push([label, count]);
  total += count;
}

for (const [label, count] of rows) {
  console.log(`${label}\t${count}`);
}
console.log(`TOTAL\t${total}`);
