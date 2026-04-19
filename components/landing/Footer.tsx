import Link from "next/link";
import { Zap } from "lucide-react";

const links = {
  Product: ["Features", "How It Works", "Pricing", "Changelog"],
  Company: ["About", "Blog", "Careers", "Press"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
  Support: ["Help Center", "Contact Us", "Status", "Community"],
};

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 cursor-pointer w-fit">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md shadow-primary/30" style={{ background: "linear-gradient(135deg, #5B4CF5, #818CF8)" }}>
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-heading font-bold text-lg text-foreground">Skillify</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              AI-powered personalized learning paths for any skill, tailored to your level and timeline.
            </p>
          </div>

          {/* Links */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <p className="font-semibold text-foreground text-sm mb-4">{section}</p>
              <ul className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Skillify. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built with AI · Powered by curiosity
          </p>
        </div>
      </div>
    </footer>
  );
}
