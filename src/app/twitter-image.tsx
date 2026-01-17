import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Routine Tracker - Build Unbreakable Discipline";
export const size = {
  width: 1200,
  height: 675,
};
export const contentType = "image/png";

export default async function Image() {
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

          {/* Features list */}
          <div
            style={{
              display: "flex",
              gap: "24px",
              marginTop: "40px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {["Focus Timer", "AI Assistant", "Gamification", "Analytics"].map((feature) => (
              <div
                key={feature}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  borderRadius: "50px",
                  background: "rgba(147, 51, 234, 0.15)",
                  border: "1px solid rgba(147, 51, 234, 0.25)",
                }}
              >
                <span
                  style={{
                    color: "#c084fc",
                    fontSize: "16px",
                    fontWeight: "500",
                  }}
                >
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span
            style={{
              color: "#64748b",
              fontSize: "20px",
            }}
          >
            routinetracker.app
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
