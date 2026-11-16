import { ImageResponse } from "next/og";

// Link preview shown when the site is shared in Slack, iMessage and the like.
export const alt = "TCO: learn how modern AI actually works";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          color: "#fff",
          backgroundColor: "#14141a",
          backgroundImage:
            "radial-gradient(circle at 12% 0%, rgba(94,106,210,0.55), transparent 55%), radial-gradient(circle at 100% 100%, rgba(94,106,210,0.35), transparent 50%)",
        }}
      >
        <div style={{ display: "flex", fontSize: "44px", fontWeight: 800, letterSpacing: "-0.04em" }}>
          TCO
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              maxWidth: 900,
              fontSize: "84px",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
            }}
          >
            Learn how modern AI actually works.
          </div>
          <div style={{ display: "flex", marginTop: "28px", fontSize: "32px", color: "rgba(255,255,255,0.72)" }}>
            Concepts, practice and the week in tech.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
