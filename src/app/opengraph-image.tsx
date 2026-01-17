import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Routine Tracker - Build Unbreakable Discipline";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f0a1a",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background gradient */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "800px",
            height: "800px",
            background: "radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, transparent 70%)",
          }}
        />

        {/* Main content container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
            textAlign: "center",
            zIndex: 10,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100px",
                height: "100px",
                borderRadius: "24px",
                background: "linear-gradient(135deg, #9333ea 0%, #ec4899 100%)",
                boxShadow: "0 25px 50px -12px rgba(147, 51, 234, 0.5)",
              }}
            >
              <span
                style={{
                  color: "white",
                  fontSize: "48px",
                  fontWeight: "bold",
                }}
              >
                RT
              </span>
            </div>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: "64px",
              fontWeight: "bold",
              color: "#f8fafc",
              marginBottom: "20px",
              lineHeight: 1.2,
            }}
          >
            Routine Tracker
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "28px",
              color: "#94a3b8",
              maxWidth: "800px",
              lineHeight: 1.5,
            }}
          >
            Build unbreakable discipline with AI-powered task management
          </p>

          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "40px",
              padding: "12px 24px",
              borderRadius: "50px",
              background: "rgba(147, 51, 234, 0.2)",
              border: "1px solid rgba(147, 51, 234, 0.3)",
            }}
          >
            <span
              style={{
                color: "#a855f7",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              AI-Powered Productivity
            </span>
          </div>
        </div>

        {/* Decorative elements */}
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
