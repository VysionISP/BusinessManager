"use client";

// Renders an inline script that the browser executes while parsing the
// server HTML, without React ever "rendering a script tag" on the client
// (a dev warning in this Next version): client renders emit text/plain,
// which the browser ignores. Pattern from
// next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
