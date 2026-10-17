/** Single source of truth for the product name. A later rename should start here. */
export const brand = {
  name: "Pamoja IQ",
  shortName: "Pamoja",
  tagline: "Intelligent Chama Solution",
  meaning: "Pamoja means together in Kiswahili.",
  logoPath: "/brand/logo.svg",
  supportEmail: "hello@pamoja.iq",
  demoChama: "Umoja Savings Group",
  colors: {
    ink: "#0E1F1A",
    sisal: "#D9A441",
    leaf: "#1F6B4F",
    clay: "#C2643B",
    ivory: "#F6F1E7",
    paper: "#FFFDF8",
  },
} as const;

export function otpSmsBody(code: string): string {
  return `${brand.name} code: ${code}. It expires in 5 minutes.`;
}
