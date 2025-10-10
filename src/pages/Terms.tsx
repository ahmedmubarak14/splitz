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
          <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card>
          <CardContent className={`prose prose-sm dark:prose-invert max-w-none pt-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Agreement to Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using Splitz, you agree to be bound by these Terms of Service and all applicable 
                laws and regulations. If you do not agree with any of these terms, you are prohibited from using 
                this application.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Use License</h2>
              <p className="text-muted-foreground mb-3">
                Permission is granted to use Splitz for personal, non-commercial purposes. This license includes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Creating and managing personal habits</li>
                <li>Participating in group challenges</li>
                <li>Tracking and splitting expenses with friends</li>
                <li>Using focus timer features</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                This license does not allow you to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Modify or copy the application materials</li>
                <li>Use the materials for commercial purposes</li>
                <li>Attempt to reverse engineer any software in the application</li>
                <li>Remove any copyright or proprietary notations</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">User Accounts</h2>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account and password. You agree 
                to accept responsibility for all activities that occur under your account. We reserve the right 
                to terminate accounts that violate these terms.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">User Content</h2>
              <p className="text-muted-foreground mb-3">
                By posting content on Splitz, you grant us a non-exclusive, worldwide, royalty-free license to 
                use, modify, and display that content. You represent that:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>You own or have the right to use the content you post</li>
                <li>Your content does not violate any third-party rights</li>
                <li>Your content does not contain illegal or harmful material</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Prohibited Activities</h2>
              <p className="text-muted-foreground mb-3">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Use the application for any illegal purpose</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Impersonate any person or entity</li>
                <li>Upload viruses or malicious code</li>
                <li>Attempt to gain unauthorized access to the application</li>
                <li>Interfere with the proper functioning of the application</li>
                <li>Use automated systems to access the application</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Expense Splitting</h2>
              <p className="text-muted-foreground">
                The expense splitting feature is provided as a convenience tool. Splitz is not responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Actual payment transactions between users</li>
                <li>Disputes regarding expense amounts or settlements</li>
                <li>Financial losses resulting from incorrect calculations</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                All expense settlements are the responsibility of the users involved.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Disclaimer</h2>
              <p className="text-muted-foreground">
                Splitz is provided "as is" without any warranties, expressed or implied. We do not guarantee 
                that the application will be uninterrupted, secure, or error-free. Use of the application is at 
                your own risk.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Limitation of Liability</h2>
              <p className="text-muted-foreground">
                In no event shall Splitz or its suppliers be liable for any damages (including, without 
                limitation, damages for loss of data or profit) arising out of the use or inability to use the 
                application.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Service Modifications</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify or discontinue the application at any time without notice. We 
                shall not be liable to you or any third party for any modification, suspension, or 
                discontinuance of the service.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Termination</h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your account immediately, without prior notice, for any breach of 
                these Terms. Upon termination, your right to use the application will immediately cease.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. We will notify users of any changes by 
                posting the new Terms of Service on this page. Your continued use of the application after 
                changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us through the app's 
                support section or visit our profile page.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
