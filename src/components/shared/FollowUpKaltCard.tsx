import { useState } from "react";
import { ICPDonut } from "@/components/shared/ICPDonut";

interface FollowUpKaltCardProps {
  name: string;
  role: string;
  avatarInitials: string;
  avatarBg: string;
  companyInitials: string;
  companyName: string;
  companyBg: string;
  icpScore: number;
  stage: string;
  daysInStage: number;
  timeAgoLabel: string;
  aiRecommendation: string;
  generatedMessage: string;
  onOutreachClick?: () => void;
  onDetailsClick?: () => void;
}

export function FollowUpKaltCard({
  name,
  role,
  avatarInitials,
  avatarBg,
  companyInitials,
  companyName,
  icpScore,
  stage,
  daysInStage,
  timeAgoLabel,
  onOutreachClick,
  onDetailsClick,
}: FollowUpKaltCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
        cursor: "pointer",
        maxWidth: "1100px",
        width: "100%",
        margin: "0 auto",
        // Kachel-Designvorgabe: rounded-[12px]; Expand behält 2px-Highlight als Cue.
        borderRadius: "12px",
        border: expanded ? "2px solid var(--signal-info-bg)" : "1px solid var(--border-card)",
        // Animation behalten:
        transition: "all 0.2s ease-in-out",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* TOP ROW — Padding 16px */}
      <div
        style={{
          padding: "16px",
          display: "flex",
          alignItems: "center",
          gap: "0",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        {/* Avatar + Name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            flex: 1,
            minWidth: 0,
          }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "9999px",
                background: avatarBg,
                color: "var(--surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {avatarInitials}
            </div>
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {name}
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "200px",
              }}
            >
              {role}
            </div>
          </div>
        </div>

        {/* ICP + Company */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "0 20px",
            borderLeft: "1px solid var(--border-subtle)",
            flexShrink: 0,
          }}
        >
          {/* Kanonischer ICPDonut */}
          <ICPDonut score={icpScore} />

          {/* Company — dunkle Initial-Box (rounded-[12px]) + Teal-Name (Kachel-Vorgabe) */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
            <div
              style={{
                background: "var(--text-primary)",
                color: "var(--surface)",
                fontSize: "14px",
                fontWeight: 700,
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "12px",
                flexShrink: 0,
              }}
            >
              {companyInitials}
            </div>

            <span
              style={{
                fontSize: "14px",
                color: "var(--sherloq-primary)",
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "160px",
              }}
            >
              {companyName}
            </span>
          </div>
        </div>

        {/* Stage + Heat */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "0 20px",
            borderLeft: "1px solid var(--border-subtle)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              minWidth: "90px",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "-16px",
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--icon-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              STAGE
            </span>

            <div
              style={{
                padding: "6px 16px",
                borderRadius: "9999px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
              }}
            >
              {stage}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              minWidth: "80px",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "-16px",
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--icon-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              HEAT
            </span>

            <div
              style={{
                padding: "6px 14px",
                borderRadius: "9999px",
                background: "var(--signal-info-bg)",
                border: "1px solid var(--signal-info-bg)",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--signal-info-text)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "9999px",
                  background: "var(--signal-info-text)",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              Kalt
            </div>
          </div>
        </div>

        {/* Zeit + Buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            paddingLeft: "20px",
            borderLeft: "1px solid var(--border-subtle)",
            flexShrink: 0,
            marginLeft: "auto",
          }}
        >
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
              }}
            >
              {timeAgoLabel}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "4px",
                marginTop: "2px",
                color: "var(--icp-low)",
                fontWeight: 700,
                fontSize: "12px",
                whiteSpace: "nowrap",
              }}
            >
              {daysInStage}T in Stage
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--icp-low)"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>

          {!expanded ? (
            <div className="flex items-center gap-[14px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(true);
                }}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "9999px",
                  background: "var(--app-bg)",
                  color: "var(--icon-muted)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDetailsClick?.();
                }}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "9999px",
                  background: "var(--signal-teal-bg)",
                  color: "var(--sherloq-primary)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(false);
              }}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "9999px",
                background: "var(--border-subtle)",
                color: "var(--text-body)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* SIGNAL ROW — Padding 16px horizontal */}
      {!expanded && (
        <div
          style={{
            background: "var(--app-bg)",
            borderTop: "1px solid var(--border-card)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                background: "var(--signal-info-bg)",
                color: "var(--signal-info-text)",
                padding: "6px 12px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Kalt
            </div>

            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-body)",
              }}
            >
              Kontakt wird kalt. Letzter Kanal Email ohne Response. AI empfiehlt
              Kanalwechsel zu LinkedIn.
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOutreachClick?.();
              }}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-body)",
                padding: "8px 20px",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              Start Outreach
            </button>

            <button
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-body)",
                padding: "8px 20px",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Snooze
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
