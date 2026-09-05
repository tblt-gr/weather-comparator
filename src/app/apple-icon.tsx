import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const APP_ICON_BACKGROUND = "#008da9";
const APP_ICON_FOREGROUND = "#ffffff";

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
          background: "transparent",
        }}
      >
        <svg aria-hidden="true" height="180" viewBox="0 0 512 512" width="180">
          <rect width="512" height="512" rx="96" fill={APP_ICON_BACKGROUND} />
          <g
            fill="none"
            stroke={APP_ICON_FOREGROUND}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="22"
          >
            <circle cx="196" cy="196" fill={APP_ICON_FOREGROUND} r="58" stroke="none" />
            <g strokeWidth="20">
              <line x1="196" x2="196" y1="92" y2="116" />
              <line x1="196" x2="196" y1="276" y2="300" />
              <line x1="92" x2="116" y1="196" y2="196" />
              <line x1="276" x2="300" y1="196" y2="196" />
              <line x1="123" x2="140" y1="123" y2="140" />
              <line x1="252" x2="269" y1="252" y2="269" />
              <line x1="269" x2="252" y1="123" y2="140" />
              <line x1="140" x2="123" y1="252" y2="269" />
            </g>
            <path
              d="M356 248 v108 a40 40 0 1 0 56 0 V248 a28 28 0 0 0 -56 0 Z"
              fill={APP_ICON_BACKGROUND}
            />
            <line strokeWidth="18" x1="384" x2="384" y1="300" y2="372" />
            <circle cx="384" cy="384" fill={APP_ICON_FOREGROUND} r="20" stroke="none" />
          </g>
        </svg>
      </div>
    ),
    { ...size }
  );
}
