import { useIsRTL } from '@/lib/rtl-utils';
import { Card, CardContent } from '@/components/ui/card';
import { responsiveText, responsiveSpacing } from '@/lib/responsive-utils';

const Terms = () => {
  const isRTL = useIsRTL();

  return (
    <div className={`min-h-screen bg-background ${responsiveSpacing.pageContainer} ${responsiveSpacing.mobileNavPadding}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h1 className={`${responsiveText.pageTitle} font-bold mb-2`}>Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString(undefined, { calendar: 'gregory' })}</p>
        </div>

        <Card>
          <CardContent className={`prose prose-sm dark:prose-invert max-w-none pt-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Agreement to Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using Splitz ("the Service"), you agree to be bound by these Terms of Service 
                ("Terms") and all applicable laws and regulations. If you do not agree with any of these terms, 
                you are prohibited from using or accessing this application. These Terms apply to all visitors, 
                users, and others who access or use the Service.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Use License</h2>
              <p className="text-muted-foreground mb-3">
                Permission is granted to use Splitz for personal, non-commercial purposes. This license includes 
                the right to:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Create and manage personal habits and track progress</li>
                <li>Participate in group challenges with friends</li>
                <li>Track and split expenses with other users</li>
                <li>Use focus timer and productivity features</li>
                <li>Upload receipts and profile images</li>
              </ul>
              <p className="text-muted-foreground mt-3 mb-2">
                This license does not allow you to:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Modify, copy, or create derivative works of the application</li>
                <li>Use the Service for any commercial purposes without our written consent</li>
                <li>Attempt to reverse engineer, decompile, or disassemble any software</li>
                <li>Remove any copyright, trademark, or proprietary notices</li>
                <li>Transfer the rights granted to you under this license</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">User Accounts and Responsibilities</h2>
              <p className="text-muted-foreground mb-3">
                When you create an account with us, you must provide accurate, complete, and current information. 
                Failure to do so constitutes a breach of these Terms.
              </p>
              <p className="text-muted-foreground mb-3">
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Maintaining the confidentiality of your account password</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized access</li>
                <li>Ensuring your account information remains accurate and up-to-date</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                We reserve the right to terminate accounts, remove or edit content, or cancel orders at our sole 
                discretion, particularly if we believe there has been a violation of these Terms.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">User Content and Conduct</h2>
              <p className="text-muted-foreground mb-3">
                By posting content on Splitz (including habits, challenge descriptions, expense notes, comments, 
                or images), you grant us a non-exclusive, worldwide, royalty-free, perpetual, and transferable 
                license to use, modify, reproduce, and display that content solely for the purpose of operating 
                and improving the Service.
              </p>
              <p className="text-muted-foreground mb-3">
                You represent and warrant that:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>You own or have the necessary rights to use and authorize us to use all content you post</li>
                <li>Your content does not violate any third-party rights (including intellectual property rights)</li>
                <li>Your content does not contain illegal, harmful, threatening, abusive, or defamatory material</li>
                <li>Your content does not contain viruses or other harmful code</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Prohibited Activities</h2>
              <p className="text-muted-foreground mb-3">
                You agree not to engage in any of the following prohibited activities:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Using the Service for any illegal purpose or in violation of any laws</li>
                <li>Harassing, abusing, threatening, or intimidating other users</li>
                <li>Impersonating any person or entity, or falsely stating your affiliation</li>
                <li>Uploading viruses, malware, or any other malicious code</li>
                <li>Attempting to gain unauthorized access to the Service or user accounts</li>
                <li>Interfering with or disrupting the Service or servers</li>
                <li>Using automated systems (bots, scrapers) to access the Service</li>
                <li>Collecting or harvesting personal information from other users</li>
                <li>Posting spam, advertisements, or promotional material without permission</li>
                <li>Circumventing any security features or access controls</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Expense Splitting Disclaimer</h2>
              <p className="text-muted-foreground mb-3">
                The expense splitting feature is provided as a convenience tool for managing shared costs. 
                <strong> Splitz is NOT a payment processor and does not facilitate actual money transfers.</strong>
              </p>
              <p className="text-muted-foreground mb-3">
                Splitz is not responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Actual payment transactions between users</li>
                <li>Disputes regarding expense amounts, splits, or settlements</li>
                <li>Financial losses resulting from incorrect data entry or calculations</li>
                <li>Non-payment by other users in your expense groups</li>
                <li>The accuracy of receipt uploads or expense categorization</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                All expense settlements and payment transactions are the sole responsibility of the users involved. 
                We recommend using established payment platforms for actual money transfers.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Intellectual Property Rights</h2>
              <p className="text-muted-foreground mb-3">
                The Service and its original content (excluding user-generated content), features, and functionality 
                are and will remain the exclusive property of Splitz and its licensors. The Service is protected by 
                copyright, trademark, and other laws. Our trademarks and trade dress may not be used without our 
                prior written consent.
              </p>
              <p className="text-muted-foreground">
                For detailed copyright information, please visit our{' '}
                <a href="/copyright" className="text-primary hover:underline font-medium">
                  Copyright Information Page
                </a>
                .
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Disclaimer of Warranties</h2>
              <p className="text-muted-foreground mb-3">
                The Service is provided "AS IS" and "AS AVAILABLE" without any warranties of any kind, either 
                express or implied, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Warranties of merchantability or fitness for a particular purpose</li>
                <li>Warranties that the Service will be uninterrupted, secure, or error-free</li>
                <li>Warranties regarding the accuracy, reliability, or completeness of content</li>
                <li>Warranties that defects will be corrected</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                Your use of the Service is at your own risk. We do not warrant that the Service will meet your 
                requirements or expectations.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Limitation of Liability</h2>
              <p className="text-muted-foreground">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL SPLITZ, ITS AFFILIATES, OFFICERS, 
                DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, 
                OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, 
                DATA, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE 
                THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to defend, indemnify, and hold harmless Splitz and its affiliates from any claims, 
                liabilities, damages, losses, and expenses (including reasonable attorney fees) arising out of 
                or related to: (a) your use of the Service; (b) your violation of these Terms; (c) your violation 
                of any rights of another party; or (d) your user content.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Service Modifications and Availability</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any 
                time, with or without notice, for any reason. We may also impose limits on certain features or 
                restrict access to parts or all of the Service without notice or liability. You agree that we shall 
                not be liable to you or any third party for any modification, suspension, or discontinuance of the 
                Service.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Account Termination</h2>
              <p className="text-muted-foreground mb-3">
                We may terminate or suspend your account and access to the Service immediately, without prior 
                notice or liability, for any reason, including without limitation if you breach these Terms.
              </p>
              <p className="text-muted-foreground">
                Upon termination, your right to use the Service will immediately cease. If you wish to terminate 
                your account, you may do so through the account settings in your profile. All provisions of these 
                Terms which by their nature should survive termination shall survive, including ownership provisions, 
                warranty disclaimers, indemnity, and limitations of liability.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Governing Law and Disputes</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard 
                to conflict of law provisions. Any disputes arising from these Terms or your use of the Service 
                shall be resolved through binding arbitration, except that either party may seek injunctive relief 
                in court for infringement of intellectual property rights.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify or replace these Terms at any time at our sole discretion. We will 
                provide notice of any material changes by posting the new Terms on this page and updating the "Last 
                updated" date. For significant changes, we may also send you an email notification. Your continued 
                use of the Service after such changes constitutes your acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Severability</h2>
              <p className="text-muted-foreground">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be 
                limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in 
                full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
              <p className="text-muted-foreground mb-3">
                If you have any questions, concerns, or complaints about these Terms of Service, please contact us:
              </p>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-medium">Email: legal@splitz.live</p>
                <p className="text-sm">Terms of Service URL: https://splitz.live/terms</p>
                <p className="text-sm">
                  Privacy Policy:{' '}
                  <a href="/privacy" className="text-primary hover:underline">
                    https://splitz.live/privacy
                  </a>
                </p>
                <p className="text-sm">
                  Copyright Information:{' '}
                  <a href="/copyright" className="text-primary hover:underline">
                    https://splitz.live/copyright
                  </a>
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  We will respond to your inquiry within 48 hours during business days.
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
