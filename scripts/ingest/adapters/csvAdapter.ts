import { readFileSync } from "node:fs";
import Papa from "papaparse";
import type { RawCardRecord, SourceAdapter } from "../adapter";

export const csvAdapter: SourceAdapter = {
  id: "csv",
  description: "Reads card rows from a local CSV file (--file=./path/to/file.csv)",
  async fetchRaw(options) {
    const file = options.file ?? "scripts/data/sample-cards.csv";
    const content = readFileSync(file, "utf-8");
    const { data, errors } = Papa.parse<RawCardRecord>(content, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });
    if (errors.length > 0) {
      throw new Error(`CSV parse errors in ${file}: ${JSON.stringify(errors.slice(0, 5))}`);
    }
    return data;
  },
};
