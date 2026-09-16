export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-ink">
      <h1 className="font-display font-extrabold text-2xl text-navy mb-2">
        Privacy Policy
      </h1>
      <p className="text-xs text-ink-soft mb-8">Last updated: Sept 16, 2026</p>

      <div className="rounded-xl bg-[#FDF3E7] border border-amber p-4 text-sm text-[#8A5A1E] mb-8">
        <strong>Read Policy:</strong>
      </div>

      <div className="flex flex-col gap-5 text-[14px] leading-relaxed">
        <section>
          <h2 className="font-display font-bold text-base text-navy mb-2">
            1. What we collect
          </h2>
          <p>
            Account information: name, email, phone number, date of
            birth. Identity verification: your BVN (used to verify your
            identity via our payment processor; we store only the last 4
            digits after verification, never the full number). Financial
            information: linked bank account details, transaction
            history, wallet balance, savings goals. Content you post in
            the community forum. Technical information: IP address,
            device/browser information, collected automatically for
            security purposes (e.g. detecting suspicious login activity).
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-base text-navy mb-2">
            2. How we use it
          </h2>
          <p>
            To provide the Service — process deposits and withdrawals,
            verify your identity, calculate savings progress, send
            transaction notifications and savings reminders. To prevent
            fraud and comply with legal obligations. To communicate with
            you about your account. We do not sell your personal data.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-base text-navy mb-2">
            3. Who we share it with
          </h2>
          <p>
            Paystack (payment processing, identity verification, bank
            transfers), our database and
            authentication infrastructure. Each processes data under
            their own privacy terms. We may also share information if
            required by law or a valid legal request.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-base text-navy mb-2">
            4. How long we keep it
          </h2>
          <p>
            We retain account and transaction data for as long as your
            account is active, and for a period afterward as required
            for financial record-keeping and legal compliance.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-base text-navy mb-2">
            5. Security
          </h2>
          <p>
            We use industry-standard practices to protect your data,
            including encrypted connections, row-level access controls
            on our database, and optional two-factor authentication on
            your account. No system is completely secure, and we
            encourage you to use a strong, unique password and enable
            two-factor authentication.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-base text-navy mb-2">
            6. Your rights
          </h2>
          <p>
            You can access and update most of your account information
            from your profile. You can request a copy of your data or
            request deletion of your account by contacting us — note
            that some financial records may need to be retained even
            after account closure for legal compliance.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-base text-navy mb-2">
            7. Changes to this policy
          </h2>
          <p>
            We may update this policy from time to time. We&apos;ll
            notify you of material changes.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-base text-navy mb-2">
            8. Contact
          </h2>
          <p>Questions about your data: [contact support].</p>
        </section>
      </div>
    </main>
  );
}
