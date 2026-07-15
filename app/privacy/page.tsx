import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
            <p>
              CellKore (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the CellKore website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service and the choices you have associated with that data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Information Collection and Use</h2>
            <p>We collect several different types of information for various purposes to provide and improve our service to you.</p>
            <h3 className="text-lg font-semibold text-foreground mb-2">Types of Data Collected:</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Personal Data: Name, email address, phone number, billing address</li>
              <li>Usage Data: Browser type, pages visited, time spent on pages</li>
              <li>Cookie Data: Information about how you interact with our website</li>
              <li>Payment Information: Processed securely through third-party providers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Use of Data</h2>
            <p>CellKore uses the collected data for various purposes:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>To provide and maintain our service</li>
              <li>To notify you about changes to our service</li>
              <li>To allow you to participate in interactive features of our service</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information for improving our service</li>
              <li>To monitor the usage of our service</li>
              <li>To detect, prevent and address technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Security of Data</h2>
            <p>
              The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date at the top of this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-2">
              CellKore<br />
              123 Tech Street<br />
              Silicon Valley, CA 94025<br />
              Phone: 1-800-CELL-CORE<br />
              Email: privacy@cellkore.com
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">7. Your Rights</h2>
            <p>
              You have the right to request access to, correction of, or deletion of your personal information. You may also request that we limit how we use your information. To exercise any of these rights, please contact us using the information above.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">8. Cookies</h2>
            <p>
              We use cookies and similar technologies to track activity on our website and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">9. Third-Party Links</h2>
            <p>
              Our website may contain links to other websites that are not operated by us. This Privacy Policy applies only to information we collect on our website. We are not responsible for the privacy practices of third-party websites and encourage you to read their privacy policies before providing any personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">10. Policy Updates</h2>
            <p>
              Last updated: July 15, 2024<br />
              This Privacy Policy is effective as of the date listed above and applies to all users of our website and service.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  )
}
