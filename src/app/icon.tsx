import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 6,
        }}
      >
        <div
          style={{
            color: "#3b82f6",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.05em",
          }}
        >
          P
        </div>
      </div>
    ),
    { ...size }
  );
}
