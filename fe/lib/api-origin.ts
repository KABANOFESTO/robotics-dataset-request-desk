export function normalizeApiOrigin(origin: string): string {
  const trimmedOrigin = origin.trim();
  return (
    trimmedOrigin.startsWith("http://") || trimmedOrigin.startsWith("https://")
      ? trimmedOrigin
      : `http://${trimmedOrigin}`
  ).replace(/\/$/, "");
}
