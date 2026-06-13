import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";
import { rename, unlink } from "fs/promises";

const execFileAsync = promisify(execFile);

const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"]);

export function isVideoFile(filename: string): boolean {
  return VIDEO_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

async function getVideoCodec(filepath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=codec_name",
      "-of",
      "csv=p=0",
      filepath,
    ]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

/** Transcode to H.264 MP4 for browser playback; returns final file path. */
export async function ensureBrowserCompatibleVideo(filepath: string): Promise<string> {
  if (!isVideoFile(filepath)) return filepath;

  const codec = await getVideoCodec(filepath);
  if (codec === "h264") return filepath;

  const dir = path.dirname(filepath);
  const tmpPath = path.join(dir, `.transcode-${path.basename(filepath)}.mp4`);

  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    filepath,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "23",
    "-movflags",
    "+faststart",
    "-pix_fmt",
    "yuv420p",
    "-an",
    tmpPath,
  ]);

  await unlink(filepath);
  const finalPath = path.join(dir, `${path.basename(filepath, path.extname(filepath))}.mp4`);
  await rename(tmpPath, finalPath);
  return finalPath;
}
