import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = localStorage.getItem("eios_token");

      if (token) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #0369a1 100%)",
        color: "#ffffff",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "88px",
            height: "88px",
            margin: "0 auto 24px",
            borderRadius: "24px",
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            fontWeight: "800",
            letterSpacing: "2px",
          }}
        >
          EIOS
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "34px",
            lineHeight: 1.2,
          }}
        >
          EIOS Enterprise Platform
        </h1>

        <p
          style={{
            margin: "14px 0 0",
            fontSize: "17px",
            opacity: 0.9,
          }}
        >
          Enterprise Intelligence and Operations System
        </p>

        <div
          style={{
            width: "48px",
            height: "48px",
            margin: "34px auto 0",
            border: "5px solid rgba(255,255,255,0.25)",
            borderTopColor: "#ffffff",
            borderRadius: "50%",
            animation: "eios-spin 0.9s linear infinite",
          }}
        />

        <p
          style={{
            marginTop: "22px",
            fontSize: "14px",
            opacity: 0.75,
          }}
        >
          Loading secure platform...
        </p>

        <p
          style={{
            marginTop: "40px",
            fontSize: "12px",
            opacity: 0.6,
          }}
        >
          Version 1.0
        </p>
      </div>

      <style>
        {`
          @keyframes eios-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}
