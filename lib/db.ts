import Dexie, { Table } from "dexie";

export interface ResultRecord {
  id?: number;
  createdAt: number;
  source: "on-device" | "mock" | "sample";
  raw?: string;
  json: any;
}

class AppDB extends Dexie {
  results!: Table<ResultRecord, number>;
  constructor() {
    super("triunfoUIForgeDB");
    this.version(1).stores({
      results: "++id, createdAt",
    });
  }
}

export const db = new AppDB();
