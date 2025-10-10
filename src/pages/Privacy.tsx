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
                At Splitz, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our application. Please read 
                this policy carefully to understand our practices regarding your personal data.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
              
              <h3 className="text-lg font-medium mb-2 mt-4">Personal Information</h3>
              <p className="text-muted-foreground mb-2">
                When you register for Splitz, we collect:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Full name</li>
                <li>Email address</li>
                <li>Profile picture (optional)</li>
                <li>Language preference</li>
              </ul>

              <h3 className="text-lg font-medium mb-2 mt-4">Usage Data</h3>
              <p className="text-muted-foreground mb-2">
                We automatically collect certain information when you use Splitz:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Habits created and check-in history</li>
                <li>Challenges joined and progress data</li>
                <li>Expense groups and transaction records</li>
                <li>Focus session statistics</li>
                <li>Device type, operating system, and browser information</li>
                <li>App usage patterns and feature interactions</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
              <p className="text-muted-foreground mb-3">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide, maintain, and improve our services</li>
                <li>Process and complete transactions within the app</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Monitor and analyze usage patterns to improve user experience</li>
                <li>Detect, prevent, and address technical issues or fraudulent activity</li>
                <li>Send promotional communications (with your consent)</li>
                <li>Personalize your experience based on your preferences</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">How We Share Your Information</h2>
              
              <h3 className="text-lg font-medium mb-2 mt-4">With Other Users</h3>
              <p className="text-muted-foreground">
                When you join a challenge or expense group, other members can see your name, 
                profile picture, and relevant activity within that group. We never share your email 
                address with other users without your explicit consent.
              </p>

              <h3 className="text-lg font-medium mb-2 mt-4">Service Providers</h3>
              <p className="text-muted-foreground mb-2">
                We use third-party services to help us operate our platform:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li><strong>Supabase:</strong> Database and authentication services</li>
                <li><strong>Resend:</strong> Email delivery services</li>
                <li><strong>Cloud Storage:</strong> Secure storage for images and receipts</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                These providers are contractually obligated to protect your data and use it only for 
                the purposes we specify.
              </p>

              <h3 className="text-lg font-medium mb-2 mt-4">Legal Requirements</h3>
              <p className="text-muted-foreground">
                We may disclose your information if required by law, in response to valid requests by 
                public authorities, or to protect our rights and safety or the rights and safety of others.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Data Security</h2>
              <p className="text-muted-foreground mb-3">
                We implement appropriate technical and organizational security measures to protect 
                your personal information, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Encryption of data in transit using HTTPS/TLS</li>
                <li>Encryption of data at rest in our databases</li>
                <li>Row-level security (RLS) policies on our database</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Secure authentication mechanisms with password hashing</li>
                <li>Access controls and activity monitoring</li>
                <li>Regular backups and disaster recovery procedures</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                However, no method of transmission over the Internet or electronic storage is 100% secure. 
                While we strive to use commercially acceptable means to protect your data, we cannot 
                guarantee absolute security.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Your Privacy Rights</h2>
              <p className="text-muted-foreground mb-3">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correct:</strong> Update inaccurate or incomplete information</li>
                <li><strong>Delete:</strong> Request deletion of your account and all associated data</li>
                <li><strong>Export:</strong> Download your data in a portable format</li>
                <li><strong>Object:</strong> Object to processing of your personal data</li>
                <li><strong>Restrict:</strong> Request restriction of processing your data</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                To exercise these rights, please use the account settings in your profile or contact us 
                at privacy@splitz.live. We will respond to your request within 30 days.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal information for as long as your account is active or as needed 
                to provide you services. If you delete your account, we will permanently delete your data 
                within 30 days, except where we are legally required to retain it (e.g., for tax, legal, 
                or accounting purposes). Aggregated, anonymized data may be retained for analytics purposes.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Cookies and Tracking</h2>
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to track activity on our application and 
                store certain information. Cookies are files with a small amount of data that may include an 
                anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate 
                when a cookie is being sent. However, if you do not accept cookies, you may not be able to use 
                some portions of our service.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Children's Privacy</h2>
              <p className="text-muted-foreground">
                Splitz is not intended for children under 13 years of age (or 16 in the European Economic Area). 
                We do not knowingly collect personal information from children. If you are a parent or guardian 
                and believe we have collected information from a child, please contact us immediately and we will 
                take steps to delete such information.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and maintained on servers located outside of your country, 
                where data protection laws may differ from those in your jurisdiction. By using Splitz, you consent 
                to such transfers. We will take all steps reasonably necessary to ensure that your data is treated 
                securely and in accordance with this Privacy Policy.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                the new Privacy Policy on this page and updating the "Last updated" date at the top. For material 
                changes, we may also send you an email notification. We encourage you to review this Privacy Policy 
                periodically for any updates.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
              <p className="text-muted-foreground mb-3">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">Email: privacy@splitz.live</p>
                <p className="text-sm text-muted-foreground mt-2">
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

export default Privacy;
