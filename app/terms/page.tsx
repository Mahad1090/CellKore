import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-8">Terms & Conditions</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the CellKore website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials (information or software) on CellKore&apos;s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on the website</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or 'mirroring' the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Disclaimer</h2>
            <p>
              The materials on CellKore&apos;s website are provided on an 'as is' basis. CellKore makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Limitations</h2>
            <p>
              In no event shall CellKore or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on CellKore&apos;s website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Accuracy of Materials</h2>
            <p>
              The materials appearing on CellKore&apos;s website could include technical, typographical, or photographic errors. CellKore does not warrant that any of the materials on its website are accurate, complete, or current. CellKore may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Links</h2>
            <p>
              CellKore has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by CellKore of the site. Use of any such linked website is at the user&apos;s own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">7. Modifications</h2>
            <p>
              CellKore may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">8. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of the State of California and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">9. Return Policy</h2>
            <p>
              CellKore offers a 30-day money-back guarantee for all products. Items must be in their original condition with all packaging and accessories included. Shipping costs are non-refundable unless the item is defective.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">10. Contact Information</h2>
            <p>
              If you have any questions about these Terms & Conditions, please contact us at:
            </p>
            <p className="mt-2">
              CellKore<br />
              123 Tech Street<br />
              Silicon Valley, CA 94025<br />
              Phone: 1-800-CELL-CORE<br />
              Email: legal@cellkore.com
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  )
}
