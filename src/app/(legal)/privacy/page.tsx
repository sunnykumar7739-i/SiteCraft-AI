export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article className="space-y-4 text-cocoa-2">
      <h1 className="text-3xl font-bold text-cocoa">Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long" })}</p>
      <p>We store your account details, the projects you create (source URLs, screenshots, descriptions) and the generated HTML so you can return to them. Page content you submit is sent to our AI provider solely to generate your design.</p>
      <p>We do not sell personal data. You can delete projects at any time from the dashboard, and request account deletion by contacting us.</p>
      <p className="text-cocoa-3 text-sm">Replace this placeholder with your own policy before launching publicly.</p>
    </article>
  );
}
