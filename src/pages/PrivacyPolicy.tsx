import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <Link to="/settings" className="flex items-center gap-2 text-muted-foreground text-caption mb-4 hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Settings
        </Link>
        <h1 className="font-display text-h1 text-foreground">Privacy Policy</h1>
        <p className="text-caption text-muted-foreground mt-2">Last updated: March 7, 2026</p>
      </div>

      <div className="px-5 space-y-6 text-body text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-foreground font-semibold mb-2">1. Data We Collect</h2>
          <p>We collect the following data when you use Wisdom AI:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong className="text-foreground">Account data:</strong> Email address, display name, and password (hashed).</li>
            <li><strong className="text-foreground">Profile data:</strong> Learning style, goals, plan type.</li>
            <li><strong className="text-foreground">Usage data:</strong> Lessons completed, quiz scores, tokens earned, streak data, chat messages with the AI coach.</li>
            <li><strong className="text-foreground">Device data:</strong> Browser type, screen size (for analytics and optimization).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mb-2">2. Why We Collect Data</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>To provide personalized learning experiences.</li>
            <li>To track your progress across sessions and devices.</li>
            <li>To improve the AI coach's contextual awareness (e.g., knowing your name, learning style).</li>
            <li>To prevent abuse and ensure fair use of token/reward systems.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mb-2">3. How We Use Your Data</h2>
          <p>Your data is used solely to deliver and improve the Wisdom AI learning experience. We do NOT sell your data to third parties. AI chat messages are processed through our secure backend and are not used to train external models.</p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mb-2">4. Data Retention</h2>
          <p>Your data is retained for as long as your account is active. If you delete your account, all associated data will be permanently removed within 30 days.</p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mb-2">5. Subscriptions</h2>
          <p>Wisdom AI offers Free and Pro plans. Subscription management and billing are handled through secure third-party payment processors. We do not store credit card details.</p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mb-2">6. Analytics</h2>
          <p>We use privacy-respecting analytics to understand how users interact with the app. No personally identifiable information is shared with analytics providers.</p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mb-2">7. Account Deletion</h2>
          <p>You can request account deletion at any time through Settings → Account → Delete My Account. This will permanently remove all your data including progress, chat history, and profile information.</p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mb-2">8. Contact</h2>
          <p>For privacy-related questions or data requests, contact us at:</p>
          <p className="text-primary mt-1">support@wisdomowl.app</p>
        </section>
      </div>
    </div>
  );
}
