import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { stateDir } from "./paths.js";

export interface UserPrefs {
  notifyEmail: boolean;
  notifyPush: boolean;
  notifySms: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  notifications: UserPrefs;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  token: string;
  profileId: string;
  createdAt: string;
}

interface ProfileFile {
  profiles: UserProfile[];
  sessions: Session[];
}

function file(): string {
  return path.join(stateDir(), "profiles.json");
}

async function loadFile(): Promise<ProfileFile> {
  try {
    return JSON.parse(await readFile(file(), "utf8")) as ProfileFile;
  } catch {
    return { profiles: [], sessions: [] };
  }
}

async function saveFile(data: ProfileFile): Promise<void> {
  await mkdir(stateDir(), { recursive: true });
  await writeFile(file(), JSON.stringify(data, null, 2), "utf8");
}

export async function createProfile(input: { name: string; avatar?: string; bio?: string }): Promise<{ profile: UserProfile; token: string }> {
  const data = await loadFile();
  const now = new Date().toISOString();
  const profile: UserProfile = {
    id: randomUUID(),
    name: input.name.trim().slice(0, 80) || "Operator",
    avatar: (input.avatar ?? "").slice(0, 500),
    bio: (input.bio ?? "").slice(0, 500),
    notifications: { notifyEmail: true, notifyPush: true, notifySms: false },
    createdAt: now,
    updatedAt: now,
  };
  const token = randomBytes(24).toString("hex");
  data.profiles.push(profile);
  data.sessions.push({ token, profileId: profile.id, createdAt: now });
  await saveFile(data);
  return { profile, token };
}

export async function updateProfile(
  id: string,
  patch: Partial<Pick<UserProfile, "name" | "avatar" | "bio">> & { notifications?: UserPrefs },
): Promise<UserProfile | null> {
  const data = await loadFile();
  const p = data.profiles.find((x) => x.id === id);
  if (!p) return null;
  if (typeof patch.name === "string" && patch.name.trim()) p.name = patch.name.trim().slice(0, 80);
  if (typeof patch.avatar === "string") p.avatar = patch.avatar.slice(0, 500);
  if (typeof patch.bio === "string") p.bio = patch.bio.slice(0, 500);
  if (patch.notifications) p.notifications = patch.notifications;
  p.updatedAt = new Date().toISOString();
  await saveFile(data);
  return p;
}

export async function profileFromToken(token: string | undefined): Promise<UserProfile | null> {
  if (!token) return null;
  const data = await loadFile();
  const sess = data.sessions.find((s) => s.token === token);
  if (!sess) return null;
  return data.profiles.find((p) => p.id === sess.profileId) ?? null;
}
