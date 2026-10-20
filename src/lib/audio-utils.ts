const ACCEPTED_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "video/mpeg", // browsers often report .mpeg audio this way
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/ogg",
  "audio/flac",
  "audio/webm",
];

const ACCEPTED_EXTENSIONS = [".mp3", ".mpeg", ".mpg", ".wav", ".m4a", ".ogg", ".flac", ".webm"];

const EXT_TO_MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".mpeg": "audio/mpeg",
  ".mpg": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".webm": "audio/webm",
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export function validateAudioFile(file: File): string | null {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const isValidType = ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext);

  if (!isValidType) {
    return `Unsupported file type. Please upload MP3, MPEG, WAV, M4A, OGG, or FLAC files.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 25MB.`;
  }
  return null;
}

/** Normalize browser MIME (often empty or video/mpeg for .mpeg) for the transcribe API. */
export function resolveAudioMimeType(file: File): string {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (file.type === "video/mpeg" || file.type === "audio/mp3") return "audio/mpeg";
  if (file.type && ACCEPTED_TYPES.includes(file.type)) return file.type;
  return EXT_TO_MIME[ext] || file.type || "audio/mpeg";
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:audio/...;base64, prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
