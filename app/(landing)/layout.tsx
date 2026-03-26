import LightModeWrapper from "./LightModeWrapper";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <LightModeWrapper>{children}</LightModeWrapper>;
}
