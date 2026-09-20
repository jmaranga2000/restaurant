import type { Config } from "tailwindcss";

// Design plan (see README > Design notes):
// - Ink/surface pairing is a warm charcoal, not pure black, so it holds up under
//   kitchen fluorescent lighting and long POS shifts.
// - "Ember" is the single brand accent, used sparingly for primary actions only.
// - Order-lifecycle colors are semantic and used consistently everywhere a
//   status appears (POS, KDS, customer display, dashboard) so staff build
//   muscle memory instead of relearning color per screen.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#14181D",
          soft: "#1C232B",
          line: "#2B3540",
        },
        paper: {
          DEFAULT: "#F7F5F0",
          dim: "#EDEAE2",
        },
        ember: {
          DEFAULT: "#C1631F",
          dark: "#9B4E18",
          light: "#E08A46",
        },
        status: {
          waiting: "#5B7FDB",
          preparing: "#E0A526",
          ready: "#3FAE6A",
          served: "#8A93A6",
          cancelled: "#D65A5A",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
