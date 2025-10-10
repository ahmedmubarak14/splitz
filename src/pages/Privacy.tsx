import { useIsRTL } from '@/lib/rtl-utils';
import { Card, CardContent } from '@/components/ui/card';
import { responsiveText, responsiveSpacing } from '@/lib/responsive-utils';

const Privacy = () => {
  const isRTL = useIsRTL();

  return (
    <div className={`min-h-screen bg-background ${responsiveSpacing.pageContainer} ${responsiveSpacing.mobileNavPadding}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h1 className={`${responsiveText.pageTitle} font-bold mb-2`}>Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card>
          <CardContent className={`prose prose-sm dark:prose-invert max-w-none pt-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Introduction</h2>
              <p className="text-muted-foreground">
                Welcome to Splitz. We respect your privacy and are committed to protecting your personal data. 
                This privacy policy will inform you about how we look after your personal data when you use our 
                application and tell you about your privacy rights.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
              <p className="text-muted-foreground mb-3">
                We collect and process the following types of information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Account Information:</strong> Name, email address, and profile picture</li>
                <li><strong>Usage Data:</strong> Habits, challenges, expenses, and focus sessions you create</li>
                <li><strong>Device Information:</strong> Device type, operating system, and browser type</li>
                <li><strong>Analytics:</strong> App usage patterns and feature interactions</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
              <p className="text-muted-foreground mb-3">
                We use your information to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide and maintain our service</li>
                <li>Notify you about changes to our service</li>
                <li>Allow you to participate in interactive features</li>
                <li>Provide customer support</li>
                <li>Monitor usage and improve our application</li>
                <li>Detect, prevent and address technical issues</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate security measures to protect your personal information. Your data is 
                stored securely using industry-standard encryption. However, no method of transmission over the 
                Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Data Sharing</h2>
              <p className="text-muted-foreground mb-3">
                We do not sell your personal data. We may share your information only in these circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>With other users when you join challenges or expense groups</li>
                <li>With service providers who help us operate our application</li>
                <li>When required by law or to protect our rights</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
              <p className="text-muted-foreground mb-3">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Cookies</h2>
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to track activity on our application and store 
                certain information. You can instruct your browser to refuse all cookies or to indicate when a 
                cookie is being sent.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our service is not intended for children under 13. We do not knowingly collect personal 
                information from children under 13. If you become aware that a child has provided us with 
                personal data, please contact us.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting 
                the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us through the app's support 
                section or visit our profile page.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;
