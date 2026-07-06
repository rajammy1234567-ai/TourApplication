import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiUrl, normalizeMediaUrl } from "../constants/api";

const guessMimeType = (uri: string, mimeType?: string | null) => {
  if (mimeType?.startsWith("image/")) return mimeType;

  const filename = uri.split("/").pop() || "";
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "heic":
    case "heif":
      return "image/heic";
    default:
      return "image/jpeg";
  }
};

const buildFileName = (uri: string) => {
  const raw = uri.split("/").pop() || "photo.jpg";
  const decoded = decodeURIComponent(raw.split("?")[0]);
  if (/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(decoded)) {
    return decoded;
  }
  return `${decoded.replace(/[^a-zA-Z0-9_-]/g, "") || "photo"}.jpg`;
};

export const uploadImage = async (
  uri: string,
  mimeType?: string | null
): Promise<string> => {
  const token = await AsyncStorage.getItem("vendorToken");
  if (!token || token === "dev_skip") {
    throw new Error("Please login to upload photos");
  }

  const filename = buildFileName(uri);
  const type = guessMimeType(uri, mimeType);
  const uploadEndpoint = apiUrl("/api/vendor/upload");

  const formData = new FormData();
  formData.append("image", {
    uri,
    name: filename,
    type,
  } as unknown as Blob);

  let response: Response;
  try {
    response = await fetch(uploadEndpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch {
    throw new Error(
      `Server tak pahunch nahi paaya (${uploadEndpoint}). Backend chal raha hai? Same WiFi?`
    );
  }

  let data: { success?: boolean; message?: string; url?: string } = {};
  try {
    data = await response.json();
  } catch {
    throw new Error(
      response.status === 404
        ? "Upload API nahi mili — backend restart karo."
        : `Upload fail (HTTP ${response.status})`
    );
  }

  if (!response.ok || !data.success || !data.url) {
    throw new Error(data.message || `Upload fail (HTTP ${response.status})`);
  }

  return normalizeMediaUrl(data.url);
};