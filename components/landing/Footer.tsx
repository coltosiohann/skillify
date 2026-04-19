import Link from "next/link";
import { Zap } from "lucide-react";

const links = {
  Product: ["Features", "How It Works", "Pricing", "Changelog"],
  Company: ["About", "Blog", "Careers", "Press"],
  Support: ["Help Center", "Contact Us", "Status", "Community"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
};

export default function Footer() {
  return (
    <footer className="relative overflow-hidden" style={{ background: "#0A0E1A" }}>
      {/* Top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(91,76,245,0.50), transparent)" }} />
      {/* Subtle orb */}
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[200px] rounded-full blur-[100px] pointer-events-none" style={{ background: "rgba(91,76,245,0.06)" }} />

      <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5 cursor-pointer w-fit">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #5B4CF5, #818CF8)", boxShadow: "0 4px 14px rgba(91,76,245,0.40)" }}
              >
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-heading font-bold text-lg text-white">Skillify</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-[200px]" style={{ color: "rgba(255,255,255,0.40)" }}>
              AI-powered personalized learning paths for any skill, tailored to your level and timeline.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              {["Twitter", "GitHub", "LinkedIn"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <p className="font-semibold text-white text-xs uppercase tracking-widest mb-5 opacity-50">{section}</p>
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <li key={item}>
                    <Link
                      href="#"
                      className="text-sm transition-colors cursor-pointer hover:text-white"
                      style={{ color: "rgba(255,255,255,0.40)" }}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>
            © {new Date().getFullYear()} Skillify. All rights reserved.
          </p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>
            Built with AI · Powered by curiosity
          </p>
        </div>
      </div>
    </footer>
  );
}
