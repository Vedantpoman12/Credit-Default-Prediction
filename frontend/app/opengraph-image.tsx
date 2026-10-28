import { ImageResponse } from "next/og"

export const alt = "Fair Credit Scorer: fairness-constrained credit default scoring"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: 80, background: "#F7F8F5", color: "#202720" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#176B4D" }} />
          <div style={{ fontSize: 36, fontWeight: 600 }}>Fair Credit Scorer</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 600, letterSpacing: -2, lineHeight: 1.05 }}>Fair, explainable credit decisions.</div>
          <div style={{ fontSize: 30, color: "#646C64" }}>Calibrated probabilities · Equal opportunity · SHAP · Recourse</div>
        </div>
        <div style={{ fontSize: 22, color: "#646C64" }}>Educational artefact, not for real lending decisions.</div>
      </div>
    ),
    size,
  )
}
