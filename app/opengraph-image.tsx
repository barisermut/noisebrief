import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Noisebrief — Today's tech noise. Briefly.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  let syneFont: ArrayBuffer | null = null;
  try {
    const res = await fetch(
      "https://fonts.gstatic.com/s/syne/v22/8vIS7w4qzmVxsWxjBZRjr0FKM_04uQ.woff2",
      { next: { revalidate: 86400 } }
    );
    if (res.ok) {
      syneFont = await res.arrayBuffer();
    }
  } catch {
    // font fetch failed, will render with system font
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0f",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0px",
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ marginBottom: "24px" }}
        >
          <path d="M7 6H11.5L16 13.5V6H20.5V26H16.5L11.5 17.5V26H7V6Z" fill="#00d4aa" />
          <path
            d="M22 11 Q25 13.5 25 16 Q25 18.5 22 21"
            stroke="#00d4aa"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
          />
          <path
            d="M23.5 8.5 Q28 12 28 16 Q28 20 23.5 23.5"
            stroke="#00d4aa"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.5"
          />
          <path
            d="M25 6 Q31 10.5 31 16 Q31 21.5 25 26"
            stroke="#00d4aa"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
            opacity="0.25"
          />
        </svg>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontFamily: "Syne",
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: "-3px",
            color: "#ffffff",
            marginBottom: "16px",
          }}
        >
          noisebrief<span style={{ color: "#00d4aa" }}>.</span>
        </div>

        <div
          style={{
            fontFamily: "Syne",
            fontSize: 32,
            fontWeight: 400,
            color: "#71717a",
          }}
        >
          Today&apos;s tech noise. Briefly.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: syneFont
        ? [{ name: "Syne", data: syneFont, style: "normal", weight: 700 }]
        : [],
    }
  );
}
