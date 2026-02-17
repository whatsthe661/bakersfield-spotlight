import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5 -z-10" />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="prose prose-invert max-w-none"
        >
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-foreground/60 mb-8">Last Updated: December 2025</p>

          <div className="space-y-8 text-foreground/80">
            <p>
              Welcome to What's The 661, a cinematic docuseries that highlights the stories, people, and businesses of Bakersfield and the surrounding 661 community. We are committed to protecting your privacy and being fully transparent about how we collect and use information on this website.
            </p>
            <p>
              By using our website or submitting a nomination, you agree to the terms of this Privacy Policy.
            </p>

            <hr className="border-foreground/20" />

            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mb-3">A. Information You Provide</h3>
              <p>When you submit a business nomination through our form, we collect:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your name (optional depending on form)</li>
                <li>Your email (if you provide it)</li>
                <li>The name of the business you are nominating</li>
                <li>Basic details about why you are nominating them</li>
                <li>Any additional comments you choose to include</li>
              </ul>
              <p>
                We use this information solely to evaluate nominations for the What's The 661 series and to contact you if we need clarification about your submission.
              </p>
              <p className="font-semibold">
                We do not sell, rent, or share your nomination information with third-party marketers.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">B. Automatically Collected Information (Analytics)</h3>
              <p>
                We use Google Analytics 4 (GA4) to understand how visitors interact with our site. This helps us improve the user experience and know which parts of the site are the most useful.
              </p>
              <p>Google Analytics may automatically collect:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Pages visited</li>
                <li>Scroll activity, clicks, and navigation patterns</li>
                <li>Browser type and device information</li>
                <li>Approximate location (city-level only)</li>
                <li>Time spent on the site</li>
                <li>How you arrived at the site (social media, search engine, direct link, etc.)</li>
              </ul>
              <p>
                We do not collect personally identifiable information through analytics, and IP addresses are anonymized by Google.
              </p>
            </section>

            <hr className="border-foreground/20" />

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
              <p>We use the information collected to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process and review business nominations</li>
                <li>Contact nominators if clarification is needed</li>
                <li>Improve website functionality and user experience</li>
                <li>Understand how users interact with our site</li>
                <li>Plan future episodes and determine community interest</li>
                <li>Maintain the security and integrity of the website</li>
              </ul>
              <p className="font-semibold">
                We do not sell your data or use it for targeted advertising.
              </p>
            </section>

            <hr className="border-foreground/20" />

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Protect Your Information</h2>
              <p>
                We use reasonable security measures to protect the information submitted through the nomination form.
              </p>
              <p>
                However, no method of online transmission is 100% secure, and we cannot guarantee absolute protection.
              </p>
              <p>
                We never store sensitive financial information or passwords, as our site does not use user accounts.
              </p>
            </section>

            <hr className="border-foreground/20" />

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
              
              <h3 className="text-xl font-semibold mb-3">Google Analytics</h3>
              <p>This site uses Google Analytics 4.</p>
              <p>
                Google may collect and process anonymous or aggregated data as described in their own Privacy Policy.
              </p>
              <p>
                You can learn more here:{' '}
                <a 
                  href="https://policies.google.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://policies.google.com/privacy
                </a>
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">External Links</h3>
              <p>
                Our website may contain links to other businesses or social media pages.
              </p>
              <p>
                We are not responsible for the privacy practices of those external sites.
              </p>
            </section>

            <hr className="border-foreground/20" />

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Cookies and Tracking</h2>
              <p>Our site may use basic cookies for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Analytics</li>
                <li>Performance optimization</li>
                <li>Remembering simple site preferences</li>
              </ul>
              <p>We do not use cookies for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Advertising profiles</li>
                <li>Retargeting</li>
                <li>Selling personal information</li>
              </ul>
              <p>
                Visitors can control cookies through their browser settings.
              </p>
            </section>

            <hr className="border-foreground/20" />

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Your Choices</h2>
              <p>You may:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Request removal of a nomination you previously submitted</li>
                <li>Ask what information we have collected from your submission</li>
                <li>Request correction of inaccurate information</li>
              </ul>
              <p>
                To do so, email us at{' '}
                <a 
                  href="mailto:contact@whatsthe661.com" 
                  className="text-primary hover:underline"
                >
                  contact@whatsthe661.com
                </a>
                {' '}with the subject line "Privacy Request."
              </p>
            </section>

            <hr className="border-foreground/20" />

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Children's Privacy</h2>
              <p>
                What's The 661 is not directed toward children under 13.
              </p>
              <p>
                We do not knowingly collect information from children under 13.
              </p>
            </section>

            <hr className="border-foreground/20" />

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Updates to This Policy</h2>
              <p>
                We may update this Privacy Policy occasionally.
              </p>
              <p>
                Any changes will be posted on this page with a revised "Last Updated" date.
              </p>
            </section>

            <hr className="border-foreground/20" />

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or how we handle information, contact us at:
              </p>
              <p className="mt-4">
                <strong>What's The 661</strong><br />
                Email:{' '}
                <a 
                  href="mailto:contact@whatsthe661.com" 
                  className="text-primary hover:underline"
                >
                  contact@whatsthe661.com
                </a>
                <br />
                Website:{' '}
                <a 
                  href="https://whatsthe661.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://whatsthe661.com
                </a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
