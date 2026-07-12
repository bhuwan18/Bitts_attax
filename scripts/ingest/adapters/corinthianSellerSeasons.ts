import type { SourceAdapter } from "../adapter";
import {
  createCorinthianSellerAdapter,
  type CorinthianSellerProductConfig,
} from "./corinthianSellerAdapter";

// Additional corinthianseller.co.uk products beyond the 2024/25 Match Attax main set in
// corinthianSellerAdapter.ts. Same site, same markup, same crawl-delay — see the comment at the
// top of that file for the reconnaissance behind this. Sub-page counts verified live before
// adding each entry here.
const PRODUCTS: CorinthianSellerProductConfig[] = [
  {
    id: "cheerio:corinthian-seller-topps-premier-league-2026",
    description: "Topps Premier League 2026 checklist scraped from corinthianseller.co.uk",
    indexUrl: "https://www.corinthianseller.co.uk/cards-topps-premier-league-2026.php",
    subpagePrefix: "topps-premier-league-2026-cards-",
    setName: "Topps Premier League 2026",
    season: "2025/26",
  },
  {
    id: "cheerio:corinthian-seller-topps-ucc-superstars-2024",
    description: "Topps UCC Superstars 2024 checklist scraped from corinthianseller.co.uk",
    indexUrl: "https://www.corinthianseller.co.uk/cards-topps-ucc-superstars-2024.php",
    subpagePrefix: "topps-ucc-superstars-2024-cards-",
    setName: "Topps UCC Superstars 2024",
    season: "2024",
    // This product's image filenames use a two-segment code ("uccss24-cmn-001-...") that the
    // default filename-derived external_ref would truncate to just "cmn" (non-unique across all
    // 200 Common cards), and some subsets use "blank.png" placeholders with no code at all. Card
    // Number ("CMN1", "FB1", ...) is clean and unique here — see corinthianSellerAdapter.ts.
    preferCardNumberAsRef: true,
  },
  {
    id: "cheerio:corinthian-seller-matchattax-2026",
    description: "Match Attax 2025/26 checklist scraped from corinthianseller.co.uk",
    indexUrl: "https://www.corinthianseller.co.uk/cards-match-attax-2026.php",
    subpagePrefix: "match-attax-2026-cards-",
    setName: "Match Attax 2025/26",
    season: "2025/26",
  },
  {
    id: "cheerio:corinthian-seller-matchattax-extra-2026",
    description: "Match Attax Extra 2026 checklist scraped from corinthianseller.co.uk",
    indexUrl: "https://www.corinthianseller.co.uk/cards-match-attax-extra-2026.php",
    subpagePrefix: "match-attax-extra-2026-cards-",
    setName: "Match Attax Extra 2026",
    season: "2025/26",
  },
  {
    id: "cheerio:corinthian-seller-matchattax-extra-2025",
    description: "Match Attax Extra 2025 checklist scraped from corinthianseller.co.uk",
    indexUrl: "https://www.corinthianseller.co.uk/cards-match-attax-extra-2025.php",
    subpagePrefix: "match-attax-extra-2025-cards-",
    setName: "Match Attax Extra 2025",
    season: "2024/25",
  },
  {
    id: "cheerio:corinthian-seller-matchattax-2024",
    description: "Match Attax 2023/24 checklist scraped from corinthianseller.co.uk",
    indexUrl: "https://www.corinthianseller.co.uk/cards-match-attax-2024.php",
    subpagePrefix: "match-attax-2024-cards-",
    setName: "Match Attax 2023/24",
    season: "2023/24",
  },
  {
    id: "cheerio:corinthian-seller-matchattax-extra-2024",
    description: "Match Attax Extra 2024 checklist scraped from corinthianseller.co.uk",
    indexUrl: "https://www.corinthianseller.co.uk/cards-match-attax-extra-2024.php",
    subpagePrefix: "match-attax-extra-2024-cards-",
    setName: "Match Attax Extra 2024",
    season: "2023/24",
  },
  {
    id: "cheerio:corinthian-seller-matchattax-2023",
    description: "Match Attax 2022/23 checklist scraped from corinthianseller.co.uk",
    indexUrl: "https://www.corinthianseller.co.uk/cards-match-attax-2023.php",
    subpagePrefix: "match-attax-2023-cards-",
    setName: "Match Attax 2022/23",
    season: "2022/23",
  },
  {
    id: "cheerio:corinthian-seller-matchattax-extra-2023",
    description: "Match Attax Extra 2023 checklist scraped from corinthianseller.co.uk",
    indexUrl: "https://www.corinthianseller.co.uk/cards-match-attax-extra-2023.php",
    subpagePrefix: "match-attax-extra-2023-cards-",
    setName: "Match Attax Extra 2023",
    season: "2022/23",
  },
  {
    id: "cheerio:corinthian-seller-matchattax-2022",
    description: "Match Attax 2021/22 checklist scraped from corinthianseller.co.uk",
    indexUrl: "https://www.corinthianseller.co.uk/cards-match-attax-2022.php",
    subpagePrefix: "match-attax-2022-cards-",
    setName: "Match Attax 2021/22",
    season: "2021/22",
  },
  {
    id: "cheerio:corinthian-seller-matchattax-extra-2022",
    description: "Match Attax Extra 2022 checklist scraped from corinthianseller.co.uk",
    indexUrl: "https://www.corinthianseller.co.uk/cards-match-attax-extra-2022.php",
    subpagePrefix: "match-attax-extra-2022-cards-",
    setName: "Match Attax Extra 2022",
    season: "2021/22",
  },
];

export const corinthianSellerSeasonAdapters: SourceAdapter[] = PRODUCTS.map(
  createCorinthianSellerAdapter
);
