"use client"
import { useState } from "react";

const FEATURES = [
    {
        icon: "⚡",
        title: "AI Code Reviews",
        desc: "Reviews automáticos en cada PR con score 0–100 basado en calidad, seguridad y estilo.",
    },
    {
        icon: "🛡️",
        title: "Security Scanning",
        desc: "Detecta vulnerabilidades y code smells antes de que lleguen a producción.",
    },
    {
        icon: "📊",
        title: "Developer Analytics",
        desc: "Ranking de calidad de código del equipo con métricas históricas.",
    },
];

const PERMISSIONS = [
    { label: "Leer Pull Requests y diffs", scope: "pull_requests: read" },
    { label: "Publicar comentarios de revisión", scope: "pull_requests: write" },
    { label: "Leer metadata de repositorios", scope: "metadata: read" },
    { label: "Recibir webhooks de eventos", scope: "webhooks" },
];

export default function OnboardingPage() {
    const [step, setStep] = useState("intro"); // intro | permissions | redirecting

    const handleInstall = () => {
        setStep("redirecting");
        // En producción:
        window.location.href = `http://localhost:3000/api/auth/github/login`;
    };

    /* ── REDIRECTING ─────────────────────────────── */
    if (step === "redirecting") {
        return (
            <div style={styles.root}>
                <div style={{ textAlign: "center" }}>
                    <div style={styles.spinner} />
                    <h2 style={{ ...styles.heading, marginTop: "1.5rem" }}>
                        Redirigiendo a GitHub…
                    </h2>
                    <p style={styles.sub}>
                        Selecciona tu organización y los repositorios que quieres conectar.
                    </p>
                </div>
            </div>
        );
    }

    /* ── INTRO ───────────────────────────────────── */
    if (step === "intro") {
        return (
            <div style={styles.root}>
                <div style={styles.card}>
                    {/* Logo */}
                    <div style={styles.logoRow}>
                        <div style={styles.logoBox}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 3 L6 15 Q6 21 12 21 Q18 21 18 15 L18 3" />
                                <line x1="6" y1="9" x2="18" y2="9" />
                            </svg>
                        </div>
                        <span style={styles.logoText}>MergePulse</span>
                    </div>

                    <div style={styles.stepBadge}>Paso 1 de 2</div>

                    <h1 style={styles.heading}>Conecta tu organización</h1>
                    <p style={styles.sub}>
                        Instala la MergePulse GitHub App en tu org para analizar Pull
                        Requests automáticamente con IA.
                    </p>

                    {/* Features */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", margin: "1.75rem 0" }}>
                        {FEATURES.map(({ icon, title, desc }) => (
                            <div key={title} style={styles.featureCard}>
                                <div style={styles.featureIcon}>{icon}</div>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "#f0f6fc" }}>{title}</p>
                                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "#7d8590", lineHeight: 1.5 }}>{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button style={styles.btnPrimary} onClick={() => setStep("permissions")}>
                        Continuar
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "0.4rem" }}>
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    /* ── PERMISSIONS ─────────────────────────────── */
    return (
        <div style={styles.root}>
            <div style={styles.card}>
                {/* Logo */}
                <div style={styles.logoRow}>
                    <div style={styles.logoBox}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 3 L6 15 Q6 21 12 21 Q18 21 18 15 L18 3" />
                            <line x1="6" y1="9" x2="18" y2="9" />
                        </svg>
                    </div>
                    <span style={styles.logoText}>MergePulse</span>
                </div>

                <div style={styles.stepBadge}>Paso 2 de 2</div>

                <h1 style={styles.heading}>Permisos requeridos</h1>
                <p style={styles.sub}>
                    MergePulse solicita acceso mínimo. Solo los permisos estrictamente
                    necesarios para operar.
                </p>

                {/* Permissions list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", margin: "1.5rem 0" }}>
                    {PERMISSIONS.map(({ label, scope }) => (
                        <div key={scope} style={styles.permRow}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span style={{ fontSize: "0.85rem", color: "#e6edf3" }}>{label}</span>
                            </div>
                            <code style={styles.scopeBadge}>{scope}</code>
                        </div>
                    ))}
                </div>

                {/* Warning */}
                <div style={styles.warningBox}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d29922" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: "1px", flexShrink: 0 }}>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span style={{ fontSize: "0.8rem", color: "#d29922", lineHeight: 1.5 }}>
                        Podrás elegir exactamente qué repositorios incluir durante la
                        instalación. Puedes cambiar esto en cualquier momento desde
                        GitHub Settings.
                    </span>
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: "0.625rem", marginTop: "1.5rem" }}>
                    <button style={styles.btnSecondary} onClick={() => setStep("intro")}>
                        ← Atrás
                    </button>
                    <button style={styles.btnGitHub} onClick={handleInstall}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}>
                            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                        </svg>
                        Instalar en GitHub
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Styles ──────────────────────────────────────────────── */
const styles = {
    root: {
        minHeight: "100vh",
        background: "#0d1117",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    card: {
        width: "100%",
        maxWidth: "460px",
        background: "#161b22",
        border: "1px solid #30363d",
        borderRadius: "12px",
        padding: "2rem",
    },
    logoRow: {
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: "1.5rem",
    },
    logoBox: {
        width: "32px",
        height: "32px",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    logoText: {
        color: "#e6edf3",
        fontWeight: 700,
        fontSize: "1rem",
        letterSpacing: "-0.02em",
    },
    stepBadge: {
        display: "inline-block",
        fontSize: "0.72rem",
        fontWeight: 600,
        color: "#6366f1",
        background: "rgba(99,102,241,0.12)",
        border: "1px solid rgba(99,102,241,0.25)",
        borderRadius: "20px",
        padding: "2px 10px",
        marginBottom: "0.75rem",
        textTransform: "uppercase" as const,
        letterSpacing: "0.05em",
    },
    heading: {
        color: "#e6edf3",
        fontSize: "1.4rem",
        fontWeight: 700,
        margin: "0 0 0.5rem",
        letterSpacing: "-0.02em",
    },
    sub: {
        color: "#7d8590",
        fontSize: "0.875rem",
        margin: 0,
        lineHeight: 1.6,
    },
    featureCard: {
        display: "flex",
        alignItems: "flex-start",
        gap: "0.875rem",
        padding: "0.875rem 1rem",
        background: "#0d1117",
        border: "1px solid #21262d",
        borderRadius: "8px",
    },
    featureIcon: {
        fontSize: "1.1rem",
        marginTop: "1px",
        flexShrink: 0,
        width: "28px",
        textAlign: "center" as const,
    },
    permRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.6rem 0.875rem",
        background: "#0d1117",
        border: "1px solid #21262d",
        borderRadius: "8px",
        gap: "0.5rem",
    },
    scopeBadge: {
        fontSize: "0.7rem",
        color: "#7d8590",
        background: "#21262d",
        padding: "2px 7px",
        borderRadius: "4px",
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        whiteSpace: "nowrap" as const,
        flexShrink: 0,
    },
    warningBox: {
        display: "flex",
        alignItems: "flex-start",
        gap: "0.625rem",
        padding: "0.75rem 0.875rem",
        background: "rgba(210,153,34,0.08)",
        border: "1px solid rgba(210,153,34,0.2)",
        borderRadius: "8px",
        marginTop: "0.25rem",
    },
    btnPrimary: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.7rem 1.25rem",
        background: "#6366f1",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontWeight: 600,
        fontSize: "0.875rem",
        cursor: "pointer",
        letterSpacing: "-0.01em",
    },
    btnSecondary: {
        flex: "0 0 auto",
        padding: "0.7rem 1rem",
        background: "transparent",
        color: "#7d8590",
        border: "1px solid #30363d",
        borderRadius: "8px",
        fontWeight: 500,
        fontSize: "0.85rem",
        cursor: "pointer",
    },
    btnGitHub: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        padding: "0.7rem 1.25rem",
        background: "#238636",
        color: "white",
        border: "1px solid rgba(240,246,252,0.1)",
        borderRadius: "8px",
        fontWeight: 600,
        fontSize: "0.875rem",
        cursor: "pointer",
    },
    spinner: {
        width: "40px",
        height: "40px",
        border: "3px solid #21262d",
        borderTop: "3px solid #6366f1",
        borderRadius: "50%",
        margin: "0 auto",
        animation: "spin 0.8s linear infinite",
    },
};