import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, UploadType } from "expo-file-system";
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

type UploadJson = {
  success?: boolean;
  message?: string;
  url?: string;
};

/**
 * Expo's global fetch rejects RN-style FormData `{ uri, name, type }`
 * with "Unsupported FormDataPart implementation". Use expo-file-system
 * native multipart upload instead.
 */
export const uploadImage = async (
  uri: string,
  mimeType?: string | null
): Promise<string> => {
  const token = await AsyncStorage.getItem("vendorToken");
  if (!token || token === "dev_skip") {
    throw new Error("Please login to upload photos");
  }

  const type = guessMimeType(uri, mimeType);
  const uploadEndpoint = apiUrl("/api/vendor/upload");
  const file = new File(uri);

  if (!file.exists) {
    throw new Error("Selected image file not found on device");
  }

  let status = 0;
  let body = "";

  try {
    const result = await file.upload(uploadEndpoint, {
      httpMethod: "POST",
      uploadType: UploadType.MULTIPART,
      fieldName: "image",
      mimeType: type,
      parameters: {
        // Helps some servers derive filename; RN FormData used to send name=
        name: buildFileName(uri),
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    status = result.status;
    body = result.body;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Server tak pahunch nahi paaya (${uploadEndpoint}). Backend chal raha hai? Same WiFi?\n\nDetail: ${detail}`
    );
  }

  let data: UploadJson = {};
  try {
    data = body ? (JSON.parse(body) as UploadJson) : {};
  } catch {
    throw new Error(
      status === 404
        ? "Upload API nahi mili — backend restart karo."
        : `Upload fail (HTTP ${status})`
    );
  }

  if (status < 200 || status >= 300 || !data.success || !data.url) {
    throw new Error(data.message || `Upload fail (HTTP ${status})`);
  }

  return normalizeMediaUrl(data.url);
};
