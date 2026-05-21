import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              color: "#64748b",
              fontSize: 48,
              fontWeight: 800,
              letterSpacing: "0.15em",
            }}
          >
            P
          </div>
          <div
            style={{
              width: 80,
              height: 4,
              background: "#3b82f6",
              borderRadius: 2,
              boxShadow: "0 0 12px #3b82f6",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
