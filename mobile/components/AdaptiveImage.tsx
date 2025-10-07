import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";

type Props = {
  uri: string;
  style?: StyleProp<ImageStyle>;
  fallbackAspectRatio?: number; // width/height when intrinsic size not available
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
};

// Cache aspect ratios by URL to avoid repeated Image.getSize calls
const ratioCache = new Map<string, number>();

export default function AdaptiveImage({
  uri,
  style,
  fallbackAspectRatio = 1,
  resizeMode = "cover",
}: Props) {
  const [ratio, setRatio] = React.useState<number | null>(() => {
    return ratioCache.get(uri) ?? null;
  });

  React.useEffect(() => {
    let cancelled = false;
    const cached = ratioCache.get(uri);
    if (cached) {
      setRatio(cached);
      return;
    }
    // Fetch image intrinsic size to compute width/height ratio
    Image.getSize(
      uri,
      (w, h) => {
        if (cancelled) return;
        if (w > 0 && h > 0) {
          const r = w / h; // RN expects width/height
          ratioCache.set(uri, r);
          setRatio(r);
        } else {
          setRatio(fallbackAspectRatio);
        }
      },
      () => {
        if (cancelled) return;
        setRatio(fallbackAspectRatio);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [uri, fallbackAspectRatio]);

  return (
    <Image
      source={{ uri }}
      resizeMode={resizeMode}
      style={[
        { width: "100%", aspectRatio: ratio ?? fallbackAspectRatio, backgroundColor: "#f4f4f4" },
        style,
      ]}
    />
  );
}
