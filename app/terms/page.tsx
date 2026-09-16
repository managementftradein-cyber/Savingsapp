export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-ink">
      <h1 className="font-display font-extrabold text-2xl text-navy mb-2">
        Terms of Service
      </h1>
      <p className="text-xs text-ink-soft mb-8">Last updated: [DATE]</p>

      <div className="rounded-xl bg-[#FDF3E7] border border-amber p-4 text-sm text-[#8A5A1E] mb-8">
        <strong>Note:</strong>An app that holds customer funds, collects BVN data, and
        moves money to bank accounts has real regulatory exposure (CBN
        licensing requirements, NDPR data protection obligations, AML/CFT
        rules).
      </div>

      <div className="prose-sm flex flex-col gap-5 text-[14px] leading-relaxed">
        <section>
          <h2 className="font-display font-bold text-base text-navy mb-2">
            1. Acceptance of terms
          </h2>
          <p>
            By creating an account on Nestegg (&quot;the Service&quot;), you
            agree to these Terms of Service. If you don&apos;t agree,
            don&apos;t use the Service.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-base text-navy mb-2">
            2. Eligibility
          </h2>
          <p>
            You must be at least 18 years old and legally capable of
            entering a binding contract under Nigerian law to use
            Nestegg. You must provide accurate identity information,
            including for identity verification (KYC) purposes.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-base text-navy mb-2">
            3. Your account
          </h2>
          <p>
            You&apos;re responsible for keeping your password and any
            two-factor authentication method secure. You must notify us
            immediately of any unauthorized use of your account. We are
            not liable for losses caused by your failure to keep your
            credentials secure.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-base text-navy mb-2">
            4. Identity verification (KYC)
          </h2>
          <p>
            Nestegg verifies your identity using your Bank Verification
            Number (BVN) matched against a linked bank account, via a
            third-party payment processor. Until verification is
            complete, your wallet balance is capped. We may suspend or
            close accounts that fail verification or where we suspect
            fraud, money laundering, or other illegal activity.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-base text-navy mb-2">
            5. Deposits, savings goals, and withdrawals
          </h2>
          <p>
            Deposits are processed via a third-party payment processor.
            Withdrawals to your linked bank account are also processed
            through that provider and may take time to complete.
            Withdrawing before a savings goal&apos;s lock period ends may
            incur an early-withdrawal fee, disclosed at the time you set
            the lock period. [Describe any additional fees here.]
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-base text-navy mb-2">
            6. Prohibited use
          </h2>
          <p>
            You may not use Nestegg for money laundering, fraud, or any
            unlawful purpose; to hold funds on behalf of a business
            without disclosure; or to circumvent identity verification
            requirements.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-base text-navy mb-2">
            7. Community content
          </h2>
          <p>
            Posts, comments, and other content you share in the
            community forum are your responsibility. We may remove
            content or suspend accounts that violate community standards
            (harassment, spam, financial scams, illegal content).
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-base text-navy mb-2">
            8. Limitation of liability
          </h2>
          <p>
             limitation-of-liability 
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-base text-navy mb-2">
            9. Changes to these terms
          </h2>
          <p>
            We may update these terms from time to time. Continued use
            of the Service after changes take effect means you accept
            the updated terms.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-base text-navy mb-2">
            10. Contact
          </h2>
          <p>Questions about these terms: [support email/address].</p>
        </section>
      </div>
    </main>
  );
}
