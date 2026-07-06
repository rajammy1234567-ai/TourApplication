import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiUrl } from "../constants/api";

export const uploadImage = async (uri: string): Promise<string> => {
  const token = await AsyncStorage.getItem("vendorToken");
  if (!token || token === "dev_skip") {
    throw new Error("Please login to upload photos");
  }

  const filename = uri.split("/").pop() || "photo.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const ext = match?.[1]?.toLowerCase();
  const type =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  const formData = new FormData();
  formData.append("image", {
    uri,
    name: filename.includes(".") ? filename : `${filename}.jpg`,
    type,
  } as unknown as Blob);

  const response = await fetch(apiUrl("/api/vendor/upload"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok || !data.success || !data.url) {
    throw new Error(data.message || "Upload failed");
  }

  return data.url as string;
};