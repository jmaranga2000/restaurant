import type { Config } from "tailwindcss";

// Design plan (see README > Design notes):
// - Ink/surface pairing is a dark sky blue and icy white, keeping operational
//   screens calm and high-contrast across day and night use.
// - "Ember" is the single brand accent, used sparingly for primary actions only.
// - Order-lifecycle colors are semantic and used consistently everywhere a
//   status appears (POS, KDS, customer display, dashboard) so staff build
//   muscle memory instead of relearning color per screen.
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#082C46",
          soft: "#0D3D60",
          line: "#246080",
        },
        paper: {
          DEFAULT: "#F5FBFF",
          dim: "#E4F3FB",
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
