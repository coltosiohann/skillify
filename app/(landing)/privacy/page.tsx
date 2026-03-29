import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Privacy Policy — Skillify" };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      <h1 className="font-heading text-3xl font-extrabold text-foreground mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 28, 2026</p>

      <div className="prose prose-sm max-w-none text-foreground space-y-6">
        <section>
          <h2 className="font-heading text-xl font-bold mb-2">1. Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            We collect information you provide directly, including your name, email address, and profile picture when you create an account. We also collect information about your learning activity, including courses created, lessons completed, quiz results, and XP earned.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold mb-2">2. How We Use Your Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use your information to provide and improve the Service, personalize your learning experience, generate AI-powered course content tailored to your goals, calculate your progress and achievements, and send optional notifications (with your consent).
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold mb-2">3. AI and Course Generation</h2>
          <p className="text-muted-foreground leading-relaxed">
            When you create a course, we send your learning goals and preferences to an AI provider (Claude by Anthropic) to generate course content. This data is used only for content generation and is not stored by the AI provider beyond the request.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold mb-2">4. Data Storage</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your data is stored securely using Supabase (PostgreSQL) with row-level security. We implement industry-standard security measures to protect your information. Your data is stored in the EU-West region.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold mb-2">5. Data Sharing</h2>
          <p className="text-muted-foreground leading-relaxed">
            We do not sell your personal information. We share data only with service providers necessary to operate the platform (Supabase for database, Anthropic for AI content generation, Stripe for payments). Your learning progress may appear anonymously in leaderboards visible to other users.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold mb-2">6. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You have the right to access, correct, or delete your personal data at any time. You can delete your account and all associated data from the Settings page. You may also request a copy of your data by contacting us through the app.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold mb-2">7. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use cookies for authentication (session management) and to remember your preferences (e.g., dark mode). We do not use tracking or advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold mb-2">8. Children&apos;s Privacy</h2>
          <p className="text-muted-foreground leading-relaxed">
            Skillify is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold mb-2">9. Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice within the app.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold mb-2">10. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For privacy-related questions or data requests, please contact us through the app.
          </p>
        </section>
      </div>

      <div className="mt-8 pt-8 border-t border-primary/10 text-sm text-muted-foreground">
        <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
        {" · "}
        <Link href="/" className="hover:underline">Back to Skillify</Link>
      </div>
    </div>
  );
}
