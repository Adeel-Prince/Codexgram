import { Image, type ImageStyle } from "expo-image";

export function BrandLogo({ size, style }: { size: number; style?: ImageStyle }) {
  return (
    <Image
      accessibilityLabel="Codexgram logo"
      contentFit="contain"
      source={require("../../assets/images/logo.png")}
      style={[{ width: size, height: size }, style]}
    />
  );
}
