import { useIsRTL } from '@/lib/rtl-utils';
import { Card, CardContent } from '@/components/ui/card';
import { responsiveText, responsiveSpacing } from '@/lib/responsive-utils';
import { Copyright as CopyrightIcon, Shield, Info, Mail } from 'lucide-react';

const Copyright = () => {
  const isRTL = useIsRTL();
  const currentYear = new Date().getFullYear();

  return (
    <div className={`min-h-screen bg-background ${responsiveSpacing.pageContainer} ${responsiveSpacing.mobileNavPadding}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <CopyrightIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className={`${responsiveText.pageTitle} font-bold`}>Copyright Information</h1>
              <p className="text-sm text-muted-foreground">Last updated: January 15, 2025</p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className={`space-y-6 pt-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            {/* Copyright Notice */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <CopyrightIcon className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Copyright Notice</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg border border-border">
                <p className="text-lg font-semibold mb-2">
                  © {currentYear} Splitz. All Rights Reserved.
                </p>
                <p className="text-muted-foreground">
                  All content, design, graphics, compilation, magnetic translation, digital conversion, 
                  and other matters related to the Splitz application are protected under applicable 
                  copyrights, trademarks, and other proprietary rights.
                </p>
              </div>
            </section>

            {/* Ownership */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Ownership</h2>
              </div>
              <p className="text-muted-foreground mb-3">
                The Splitz application, including but not limited to its source code, databases, functionality, 
                software, website designs, audio, video, text, photographs, and graphics (collectively, the "Content"), 
                and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled 
                by Splitz or licensed to Splitz.
              </p>
              <p className="text-muted-foreground">
                The Content and Marks are provided "AS IS" for your information and personal use only. Except as 
                expressly provided in these Terms of Use, no part of the application and no Content or Marks may be 
                copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, 
                translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial 
                purpose whatsoever, without our express prior written permission.
              </p>
            </section>

            {/* Protected Materials */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Protected Materials Include</h2>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <div>
                    <p className="font-medium">Application Source Code & Software</p>
                    <p className="text-sm text-muted-foreground">
                      All software code, algorithms, and technical implementations
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <div>
                    <p className="font-medium">User Interface & Design</p>
                    <p className="text-sm text-muted-foreground">
                      Visual designs, layouts, graphics, icons, and user interface elements
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <div>
                    <p className="font-medium">Branding & Trademarks</p>
                    <p className="text-sm text-muted-foreground">
                      "Splitz" name, logo, and all associated branding materials
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <div>
                    <p className="font-medium">Documentation & Content</p>
                    <p className="text-sm text-muted-foreground">
                      Help documentation, user guides, and instructional materials
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <div>
                    <p className="font-medium">Features & Functionality</p>
                    <p className="text-sm text-muted-foreground">
                      Habit tracking systems, expense splitting algorithms, challenge mechanisms, and focus timer implementations
                    </p>
                  </div>
                </li>
              </ul>
            </section>

            {/* User Content Rights */}
            <section>
              <h2 className="text-xl font-semibold mb-3">User-Generated Content</h2>
              <p className="text-muted-foreground mb-3">
                You retain all ownership rights to content you create and upload to Splitz (including habits, 
                challenges, expense records, notes, and uploaded images). However, by posting content on Splitz, 
                you grant us a non-exclusive, worldwide, royalty-free, perpetual, and transferable license to use, 
                modify, reproduce, and display that content solely for the purpose of operating and improving the Service.
              </p>
              <div className="bg-primary/5 border-l-4 border-primary p-4 rounded">
                <p className="text-sm">
                  <strong>Important:</strong> You must own or have the necessary rights to use and authorize us to 
                  use all content you post. Any content that infringes upon third-party copyrights, trademarks, or 
                  other intellectual property rights is strictly prohibited.
                </p>
              </div>
            </section>

            {/* Restrictions */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Usage Restrictions</h2>
              <p className="text-muted-foreground mb-3">
                Without our express written permission, you may not:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✗</span>
                  <span>Reproduce, duplicate, copy, or re-sell any part of the application</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✗</span>
                  <span>Modify, reverse engineer, decompile, or disassemble the software</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✗</span>
                  <span>Create derivative works based on the application or its features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✗</span>
                  <span>Remove, alter, or obscure any copyright, trademark, or other proprietary notices</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✗</span>
                  <span>Use the Splitz name, logo, or trademarks without authorization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✗</span>
                  <span>Frame or mirror any content without our prior written consent</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✗</span>
                  <span>Use automated systems to scrape, copy, or extract data from the application</span>
                </li>
              </ul>
            </section>

            {/* Third-Party Content */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Third-Party Licenses & Attribution</h2>
              <p className="text-muted-foreground mb-3">
                Splitz uses certain open-source libraries and third-party components, each governed by their 
                respective licenses. These include:
              </p>
              <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                <div>
                  <p className="font-medium text-sm">React & React DOM</p>
                  <p className="text-xs text-muted-foreground">Licensed under MIT License</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Tailwind CSS</p>
                  <p className="text-xs text-muted-foreground">Licensed under MIT License</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Radix UI Components</p>
                  <p className="text-xs text-muted-foreground">Licensed under MIT License</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Lucide Icons</p>
                  <p className="text-xs text-muted-foreground">Licensed under ISC License</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Other Dependencies</p>
                  <p className="text-xs text-muted-foreground">
                    Complete list available in app settings or upon request
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                All third-party licenses are respected and used in accordance with their terms. The use of these 
                libraries does not affect the copyright of Splitz's proprietary code and features.
              </p>
            </section>

            {/* DMCA */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Digital Millennium Copyright Act (DMCA)</h2>
              <p className="text-muted-foreground mb-3">
                We respect the intellectual property rights of others. If you believe that any content on Splitz 
                infringes upon your copyright, please notify us with the following information:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li>• A physical or electronic signature of the copyright owner or authorized representative</li>
                <li>• Identification of the copyrighted work claimed to have been infringed</li>
                <li>• Identification of the material that is claimed to be infringing</li>
                <li>• Your contact information (address, telephone number, email)</li>
                <li>• A statement of good faith belief that the use is not authorized</li>
                <li>• A statement of accuracy made under penalty of perjury</li>
              </ul>
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium mb-2">Copyright Infringement Contact:</p>
                <p className="text-sm">Email: legal@splitz.live</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Subject line: "DMCA Copyright Infringement Notice"
                </p>
              </div>
            </section>

            {/* Enforcement */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Copyright Enforcement</h2>
              <p className="text-muted-foreground mb-3">
                We take copyright protection seriously and will:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Investigate all reported copyright violations promptly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Remove infringing content upon verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Terminate accounts of repeat infringers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Take legal action against willful infringement when necessary</span>
                </li>
              </ul>
            </section>

            {/* Contact */}
            <section className="border-t pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Contact Information</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                For questions about copyright, permissions, or licensing, please contact us:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">Legal Department</p>
                <p className="text-sm mt-2">Email: legal@splitz.live</p>
                <p className="text-sm">Copyright URL: https://splitz.live/copyright</p>
                <p className="text-sm text-muted-foreground mt-3">
                  We will respond to your inquiry within 48 hours during business days.
                </p>
              </div>
            </section>

            {/* Footer */}
            <section className="border-t pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                This copyright information is effective as of January 15, 2025
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                © {currentYear} Splitz. All Rights Reserved.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Copyright;
