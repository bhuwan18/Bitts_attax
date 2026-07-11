// Pluggable ingestion sources. Every adapter yields loosely-typed raw records
// which flow through normalize.ts before hitting the database — this is what
// lets CSV, JSON, and (future) scraped sources share one validation pipeline.
export type RawCardRecord = Record<string, unknown>;

export interface SourceAdapter {
  id: string;
  description: string;
  fetchRaw(options: Record<string, string>): Promise<RawCardRecord[]>;
}

class AdapterRegistry {
  private adapters = new Map<string, SourceAdapter>();

  register(adapter: SourceAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  get(id: string): SourceAdapter {
    const adapter = this.adapters.get(id);
    if (!adapter) {
      const known = [...this.adapters.keys()].join(", ");
      throw new Error(`Unknown adapter "${id}". Registered adapters: ${known}`);
    }
    return adapter;
  }

  list(): SourceAdapter[] {
    return [...this.adapters.values()];
  }
}

export const adapterRegistry = new AdapterRegistry();
