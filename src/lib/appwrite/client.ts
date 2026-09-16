import { Account, Client, Databases, Storage } from "appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from "@/config/env";

let client: Client | null = null;

export function getClient(): Client {
  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID) {
    throw new Error(
      "Appwrite is not configured. Set NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID."
    );
  }
  if (!client) {
    client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID);
  }
  return client;
}

export function getAccount(): Account {
  return new Account(getClient());
}

export function getDatabases(): Databases {
  return new Databases(getClient());
}

export function getStorage(): Storage {
  return new Storage(getClient());
}

export { Query, Permission, Role } from "appwrite";
