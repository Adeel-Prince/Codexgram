# Privacy policy decisions and open facts

These items are not determinable from this repository. The privacy policy uses bracketed placeholders where an operator decision or production configuration is required. Confirm each item before publication.

1. **Controller/legal entity:** Exact legal name, entity type, and principal address for the organization deciding why/how personal data is processed. Confirm whether an individual or company is the controller.
2. **Privacy contact:** A monitored privacy/data-rights email and postal contact. No working support/privacy contact is present in the source.
3. **Audience and age:** Intended countries, minimum age, whether minors are permitted, and whether the app is directed to children. The app has no age gate.
4. **Jurisdiction and legal bases:** Countries where the service operates and users are targeted; applicable privacy rights and legal basis for each processing purpose. These cannot be selected without the operator’s markets and counsel’s review.
5. **Retention:** Exact deletion timelines for Clerk accounts/records, Convex profile/activity/media, expired story records/files, support/security logs, backups, and any vendor-held remnants. Code starts asynchronous account cleanup but does not specify a deadline or backup retention. Expired stories are hidden from the active query but not deleted by that query.
6. **Hosting and transfers:** Production Clerk instance/data region, Convex deployment type and region, relevant vendor DPAs, vendor subprocessor lists, and any international transfer mechanism. Environment files were not opened and live dashboards were not inspected.
7. **Clerk telemetry and browser storage:** Confirm Clerk SDK version-specific telemetry behavior and the production Clerk configuration. The checked-in provider does not set `telemetry: { disabled: true }`; Clerk’s docs describe development-instance SDK telemetry but do not substitute for verifying this app’s production instance. Confirm web auth cookies/session storage as well.
8. **Media metadata:** Confirm what metadata (including EXIF) the native picker preserves or removes for selected/captured image and video files. The app source does not explicitly strip metadata.
9. **Sale, ads, and analytics:** Confirm whether Codexgram or its operator sells/shares personal data, uses it for advertising, or runs analytics/marketing outside the codebase. No such app SDK appears in the repository, but external business practices cannot be determined from code.
10. **Rights-request handling:** The app has profile editing and account deletion but no export, privacy access/correction request, or consent-management screen. Confirm the process and staffed channel for rights requests not supported in-app and how identity will be verified.
11. **Consent and notice:** The sign-up screen has no affirmative privacy-policy acknowledgement. Decide when and how the current privacy notice will be presented and accepted; implement any consent controls that apply in target markets.
12. **Demo seed:** Confirm whether `convex/seed.ts` is used in any production deployment and whether its Unsplash demo-image requests are enabled there.

## Working assumptions in `privacy.html`

- The app uses Clerk for identity and Convex for app records and uploaded media as shown in code. The exact live vendor configuration and contractual roles still need confirmation.
- It does not include app-level advertising, analytics, or crash-reporting SDKs in the checked-in dependency list/source. This is not a representation about any external services or operator practices outside the repository.
- User profile text, photos/videos, and interactions are used to provide the social features and shown to other signed-in users as implemented. No precise device location collection was found.
- Clerk and Convex may maintain service-side operational data under their own settings/contracts. The draft does not invent retention periods.
- The app does not offer a self-service export. Any other legally required access/correction request channel must be confirmed and staffed before the policy describes it.

This checklist is an implementation intake, not a legal determination. See reviewer notes in [`privacy.html`](privacy.html).
