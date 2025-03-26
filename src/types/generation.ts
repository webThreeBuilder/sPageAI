export interface GenerationVersion {
  id: string;
  prompt: string;
  timestamp: number;
  code: string;  // 将 code?: string 改为 code: string，确保它是必需的
}