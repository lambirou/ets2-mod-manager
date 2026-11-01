export type ModSource = "Local" | "Workshop";

export type CompatState = "compatible" | "incompatible" | "unknown";

export interface ModCheck {
  state: CompatState;
  reason: string;
  missing: string[];
  checkedAt: string;
}

export interface ModRecord {
  id: string;
  file: string;
  name: string;
  source: string;
  versions: string[];
  dlc: string[];
  category: string;
  size: number;
  author?: string;
  version?: string;
  description?: string;
  image?: string | null;
  analyzedFile?: string;
  error?: string;
  check?: ModCheck;
}

export interface Settings {
  home: string;
  game: string;
  mod: string;
  workshop: string[];
  target: string;
}

export interface Build {
  id: string;
  name: string;
  ids: string[];
}

export interface AppState {
  settings: Settings;
  builds: Build[];
  version?: string;
}

export interface ScanResult {
  mods: ModRecord[];
  dlcs: string[];
  warnings: string[];
  cancelled: boolean;
}

export interface ScanProgress {
  done: number;
  total: number;
}

export interface ProfileInfo {
  file: string;
  name: string;
  supported: boolean;
}

export interface SearchItem {
  name: string;
  url: string;
  description?: string;
  announced?: string[];
  author?: string;
}

export interface SearchSource {
  name: string;
  url: string;
  mode: "integrated" | "website";
  items: SearchItem[];
  message?: string;
  checkedAt?: string;
}

export interface ApplyRequest {
  profile: string;
  ids: string[];
}

export interface ManagerApi {
  init(): Promise<AppState>;
  scan(): Promise<ScanResult>;
  cancel(): Promise<void>;
  saveSettings(settings: Partial<Settings>): Promise<Settings>;
  chooseFolder(): Promise<string | null>;
  import(): Promise<string[]>;
  search(query: string): Promise<SearchSource[]>;
  openUrl(url: string): Promise<void>;
  saveBuilds(builds: Build[]): Promise<void>;
  profiles(): Promise<ProfileInfo[]>;
  apply(request: ApplyRequest): Promise<string | null>;
  restore(): Promise<boolean | undefined>;
  analyzeHashFS(id: string): Promise<ModRecord>;
}

export interface ProgressBridge {
  listen(callback: (progress: ScanProgress) => void): () => void;
}
