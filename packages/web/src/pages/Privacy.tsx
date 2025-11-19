import { useIsRTL } from '@/lib/rtl-utils';
import { Card, CardContent } from '@/components/ui/card';
import { responsiveText, responsiveSpacing } from '@/lib/responsive-utils';
import { Shield, Lock, Eye, Users, Bell, Trash2, Download, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Privacy = () => {
  const isRTL = useIsRTL();
  const { t } = useTranslation();

  return (
    <div className={`min-h-screen bg-background ${responsiveSpacing.pageContainer} ${responsiveSpacing.mobileNavPadding}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h1 className={`${responsiveText.pageTitle} font-bold mb-2`}>Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: January 15, 2025</p>
          <p className="text-sm text-muted-foreground mt-1">Effective date: January 15, 2025</p>
        </div>

        <Card>
          <CardContent className={`prose prose-sm dark:prose-invert max-w-none pt-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            
            {/* Introduction */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Introduction
              </h2>
              <p className="text-muted-foreground">
                Splitz ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our 
                mobile application and services. Please read this policy carefully to understand our practices 
                regarding your personal data and how we will treat it.
              </p>
              <p className="text-muted-foreground mt-2">
                By using Splitz, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            {/* Data We Collect - Apple App Store Categories */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Data We Collect
              </h2>
              
              {/* Contact Information */}
              <h3 className="text-lg font-medium mb-2 mt-4">Contact Information</h3>
              <p className="text-muted-foreground mb-2">
                We collect the following contact information to create and manage your account:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li><strong>Name:</strong> Your full name for profile identification</li>
                <li><strong>Email Address:</strong> For account creation, authentication, and communication</li>
              </ul>

              {/* User Content */}
              <h3 className="text-lg font-medium mb-2 mt-4">User Content</h3>
              <p className="text-muted-foreground mb-2">
                We collect content you create within the app:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li><strong>Photos:</strong> Profile pictures and receipt uploads (optional)</li>
                <li><strong>Habits & Challenges:</strong> Habit names, descriptions, check-in history, challenge progress</li>
                <li><strong>Expenses:</strong> Expense descriptions, amounts, categories, and related receipts</li>
                <li><strong>Focus Sessions:</strong> Task descriptions, session durations, and productivity statistics</li>
                <li><strong>Other User Content:</strong> Comments, notes, and any other content you create in the app</li>
              </ul>


              {/* Identifiers */}
              <h3 className="text-lg font-medium mb-2 mt-4">Identifiers</h3>
              <p className="text-muted-foreground mb-2">
                We collect device and account identifiers:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li><strong>User ID:</strong> Unique identifier assigned to your account</li>
                <li><strong>Device ID:</strong> Device identifiers for authentication and security purposes</li>
              </ul>

              {/* Usage Data */}
              <h3 className="text-lg font-medium mb-2 mt-4">Usage Data</h3>
              <p className="text-muted-foreground mb-2">
                We automatically collect information about how you interact with the app:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li><strong>Product Interaction:</strong> Features used, buttons clicked, screens viewed, time spent in app</li>
                <li><strong>App Performance:</strong> Crash logs, error reports, and performance metrics</li>
                <li><strong>Device Information:</strong> Device type, operating system version, app version, language preference</li>
              </ul>

              {/* Financial Information */}
              <h3 className="text-lg font-medium mb-2 mt-4">Financial Information</h3>
              <p className="text-muted-foreground mb-2">
                We collect financial data to enable expense splitting features:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li><strong>Expense Transactions:</strong> Amount, currency, date, description of expenses</li>
                <li><strong>Payment Status:</strong> Whether debts have been settled</li>
                <li><strong>Note:</strong> We do NOT collect credit card numbers, bank account details, or process payments directly</li>
              </ul>
            </section>

            {/* How We Use Your Data */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">How We Use Your Data</h2>
              
              <h3 className="text-lg font-medium mb-2 mt-4">App Functionality</h3>
              <p className="text-muted-foreground mb-2">
                We use your data to provide core app features:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Create and maintain your account</li>
                <li>Enable habit tracking, challenges, expense splitting, and focus sessions</li>
                <li>Process and store receipt photos you capture for expense tracking</li>
                <li>Sync your data across devices</li>
                <li>Facilitate collaboration with friends and groups</li>
              </ul>

              <h3 className="text-lg font-medium mb-2 mt-4">Analytics</h3>
              <p className="text-muted-foreground">
                We analyze usage patterns to improve app performance, fix bugs, and enhance user experience. 
                This includes crash reports and feature usage statistics.
              </p>

              <h3 className="text-lg font-medium mb-2 mt-4">Product Personalization</h3>
              <p className="text-muted-foreground">
                We use your preferences (e.g., language, notification settings) to customize your experience.
              </p>

              <h3 className="text-lg font-medium mb-2 mt-4">App Functionality & Other Purposes</h3>
              <p className="text-muted-foreground mb-2">
                We also use your data to:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Send important notifications about your habits, challenges, and expenses</li>
                <li>Provide customer support and respond to your inquiries</li>
                <li>Detect and prevent fraud, abuse, and security incidents</li>
                <li>Comply with legal obligations</li>
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

            {/* Data Sharing and Disclosure */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Data Sharing and Disclosure
              </h2>
              
              <h3 className="text-lg font-medium mb-2 mt-4">Data Linked to You</h3>
              <p className="text-muted-foreground mb-2">
                The following data is collected and linked to your identity:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Contact information (name, email)</li>
                <li>User content (habits, challenges, expenses, photos)</li>
                <li>Identifiers (user ID, device ID)</li>
                <li>Usage data (app interactions, performance data)</li>
              </ul>

              <h3 className="text-lg font-medium mb-2 mt-4">Sharing with Other Users</h3>
              <p className="text-muted-foreground mb-2">
                When you participate in shared features:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li><strong>Challenges & Groups:</strong> Other members can see your name, profile picture, and your activity within that specific challenge or group</li>
                <li><strong>Expense Groups:</strong> Group members can see expenses you add and your balance status</li>
                <li><strong>Invitations:</strong> When you invite someone, they receive your name as the inviter</li>
                <li><strong>Your email address is NEVER shared with other users</strong></li>
              </ul>

              <h3 className="text-lg font-medium mb-2 mt-4">Third-Party Service Providers</h3>
              <p className="text-muted-foreground mb-2">
                We share data with trusted service providers who help us operate the app:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li><strong>Cloud Infrastructure:</strong> For data storage, authentication, and hosting</li>
                <li><strong>Email Services:</strong> For sending transactional emails and notifications</li>
                <li><strong>Analytics:</strong> For app performance monitoring and crash reporting</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                These providers are contractually bound to protect your data and may only use it to provide 
                services to us. They cannot use your data for their own purposes.
              </p>

              <h3 className="text-lg font-medium mb-2 mt-4">Legal Requirements & Safety</h3>
              <p className="text-muted-foreground mb-2">
                We may disclose your information when required by law or to protect safety:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>To comply with legal obligations, court orders, or government requests</li>
                <li>To enforce our Terms of Service and protect our rights</li>
                <li>To protect the safety and security of our users and the public</li>
                <li>To detect, prevent, or address fraud, security, or technical issues</li>
              </ul>

              <h3 className="text-lg font-medium mb-2 mt-4">Business Transfers</h3>
              <p className="text-muted-foreground">
                If Splitz is involved in a merger, acquisition, or sale of assets, your data may be transferred. 
                We will provide notice before your data is transferred and becomes subject to a different privacy policy.
              </p>

              <h3 className="text-lg font-medium mb-2 mt-4">No Sale of Personal Data</h3>
              <p className="text-muted-foreground font-medium">
                We do NOT sell, rent, or trade your personal information to third parties for marketing purposes.
              </p>
            </section>

            {/* Data Security */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Data Security
              </h2>
              <p className="text-muted-foreground mb-3">
                We implement industry-standard security measures to protect your personal information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Encryption in Transit:</strong> All data transmitted between your device and our servers is encrypted using HTTPS/TLS protocols</li>
                <li><strong>Encryption at Rest:</strong> Your data is encrypted when stored in our databases</li>
                <li><strong>Authentication:</strong> Secure password hashing and account verification</li>
                <li><strong>Access Controls:</strong> Strict access policies ensuring only authorized personnel can access infrastructure</li>
                <li><strong>Row-Level Security:</strong> Database policies that prevent unauthorized access to user data</li>
                <li><strong>Regular Monitoring:</strong> Continuous security monitoring and vulnerability assessments</li>
                <li><strong>Backups:</strong> Regular encrypted backups with disaster recovery procedures</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                While we use commercially reasonable security measures, no method of transmission over the 
                Internet or electronic storage is 100% secure. We cannot guarantee absolute security, but we 
                continuously work to protect your data using best practices.
              </p>
            </section>

            {/* Your Privacy Rights */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Your Privacy Rights
              </h2>
              <p className="text-muted-foreground mb-3">
                You have control over your data. Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong>Correction:</strong> Update inaccurate or incomplete information in your profile settings</li>
                <li><strong>Deletion:</strong> Request deletion of your account and all associated data (available in Profile settings)</li>
                <li><strong>Data Portability:</strong> Export your data in a machine-readable format</li>
                <li><strong>Object:</strong> Object to certain processing of your personal data</li>
                <li><strong>Restrict Processing:</strong> Request limitation on how we process your data</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing where we rely on consent</li>
                <li><strong>Opt-out of Communications:</strong> Manage notification preferences in your profile settings</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                <strong>How to Exercise Your Rights:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Most rights can be exercised directly in the app via Profile → Settings</li>
                <li>For data export or specific requests, email privacy@splitz.live</li>
                <li>We will respond to requests within 30 days</li>
              </ul>
            </section>

            {/* Data Retention */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Data Retention
              </h2>
              <p className="text-muted-foreground mb-3">
                We retain your data based on the following criteria:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Active Accounts:</strong> Data is retained as long as your account remains active</li>
                <li><strong>Account Deletion:</strong> When you delete your account, we permanently remove your personal data within 30 days</li>
                <li><strong>Legal Obligations:</strong> Some data may be retained longer if required by law (e.g., financial records for tax purposes)</li>
                <li><strong>Anonymized Data:</strong> Aggregated, anonymized usage statistics may be retained indefinitely for analytics and product improvement</li>
                <li><strong>Backups:</strong> Deleted data may remain in backups for up to 90 days before complete removal</li>
              </ul>
            </section>

            {/* Children's Privacy */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Children's Privacy</h2>
              <p className="text-muted-foreground mb-3">
                Splitz is not intended for use by children:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li><strong>Age Requirement:</strong> You must be at least 13 years old to use Splitz (16 in the EEA)</li>
                <li><strong>No Knowingly Collection:</strong> We do not knowingly collect personal information from children under these age limits</li>
                <li><strong>Parental Notice:</strong> If you are a parent or guardian and believe your child has provided us with personal information, please contact us at privacy@splitz.live</li>
                <li><strong>Immediate Action:</strong> Upon notification, we will take steps to delete such information from our systems</li>
              </ul>
            </section>

            {/* International Data Transfers */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                International Data Transfers
              </h2>
              <p className="text-muted-foreground mb-3">
                Splitz operates globally, which means your data may be transferred and processed in different countries:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Data Storage:</strong> Your information may be stored on servers located outside your country of residence</li>
                <li><strong>Varying Laws:</strong> Data protection laws in these locations may differ from those in your jurisdiction</li>
                <li><strong>Consent:</strong> By using Splitz, you consent to the transfer of your information to these locations</li>
                <li><strong>Protections:</strong> We ensure appropriate safeguards are in place, including:
                  <ul className="list-disc pl-6 mt-1">
                    <li>Standard contractual clauses with service providers</li>
                    <li>Compliance with applicable data protection regulations (GDPR, CCPA, etc.)</li>
                    <li>Encryption of data in transit and at rest</li>
                  </ul>
                </li>
              </ul>
            </section>

            {/* California Privacy Rights (CCPA) */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">California Privacy Rights (CCPA)</h2>
              <p className="text-muted-foreground mb-3">
                If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Right to Know:</strong> Request details about the personal information we collect, use, and share</li>
                <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
                <li><strong>Right to Opt-Out:</strong> We do NOT sell your personal information, so there is no need to opt out</li>
                <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                To exercise these rights, contact us at privacy@splitz.live with "California Privacy Rights" in the subject line.
              </p>
            </section>

            {/* European Privacy Rights (GDPR) */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">European Privacy Rights (GDPR)</h2>
              <p className="text-muted-foreground mb-3">
                If you are in the European Economic Area (EEA), UK, or Switzerland, you have rights under the General Data Protection Regulation (GDPR):
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Legal Basis for Processing:</strong> We process your data based on:
                  <ul className="list-disc pl-6 mt-1">
                    <li>Contract performance (providing app services)</li>
                    <li>Legitimate interests (improving our services, security)</li>
                    <li>Your consent (marketing communications, optional features)</li>
                  </ul>
                </li>
                <li><strong>Right to Lodge a Complaint:</strong> You can file a complaint with your local data protection authority</li>
                <li><strong>Data Protection Officer:</strong> For GDPR-related inquiries, contact privacy@splitz.live</li>
              </ul>
            </section>

            {/* Do Not Track Signals */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Do Not Track Signals</h2>
              <p className="text-muted-foreground">
                We do not currently respond to Do Not Track (DNT) browser signals. We may implement DNT support 
                in future updates. You can manage tracking preferences through your device settings and our in-app 
                notification preferences.
              </p>
            </section>

            {/* Changes to This Privacy Policy */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Changes to This Privacy Policy
              </h2>
              <p className="text-muted-foreground mb-3">
                We may update this Privacy Policy periodically to reflect changes in our practices, technology, 
                legal requirements, or other factors:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Notification:</strong> We will notify you of material changes by:
                  <ul className="list-disc pl-6 mt-1">
                    <li>Updating the "Last updated" date at the top of this policy</li>
                    <li>Sending an email notification to your registered email address</li>
                    <li>Displaying an in-app notice</li>
                  </ul>
                </li>
                <li><strong>Review:</strong> We encourage you to review this policy periodically</li>
                <li><strong>Continued Use:</strong> Your continued use of Splitz after changes constitutes acceptance of the updated policy</li>
                <li><strong>Objection:</strong> If you disagree with changes, you may delete your account</li>
              </ul>
            </section>

            {/* Contact Us */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
              <p className="text-muted-foreground mb-3">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, 
                please contact us:
              </p>
              <div className="bg-muted p-6 rounded-lg space-y-3">
                <div>
                  <p className="font-semibold mb-1">Email</p>
                  <p className="text-muted-foreground">privacy@splitz.live</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Privacy Policy URL</p>
                  <p className="text-muted-foreground">https://splitz.live/privacy</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Response Time</p>
                  <p className="text-muted-foreground">We aim to respond within 48 hours during business days</p>
                </div>
              </div>
            </section>

            {/* Effective Date */}
            <section>
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Effective Date:</strong> This Privacy Policy is effective as of January 15, 2025, and applies 
                  to all data collected from that date forward.
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
