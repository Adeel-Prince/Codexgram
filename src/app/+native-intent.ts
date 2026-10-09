/** Normalize the empty app URL emitted by Android's hosted sign-in return. */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    const url = new URL(path);
    if (url.protocol !== "codexgram:") return path;

    const routePath = url.hostname
      ? `/${url.hostname}${url.pathname === "/" ? "" : url.pathname}`
      : url.pathname || "/";
    if (routePath === "/" || routePath === "") return `/${url.search}${url.hash}`;
    return `${routePath}${url.search}${url.hash}`;
  } catch {
    // Android can provide a scheme-only URL that URL() does not parse consistently.
    return path.startsWith("codexgram:") ? "/" : path;
  }
}
