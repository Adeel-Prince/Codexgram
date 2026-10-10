# Codexgram product and commercial-terms audit

**Audit date:** October 10, 2026  
**Scope:** Repository implementation inspected for terms-relevant behavior. This is a codebase review, not a production configuration, deployment, privacy, or legal review.

## What the product currently does

Codexgram is a mobile-first social photo and video app. Signed-in users can create/edit a profile, upload image or video posts, follow other profiles, browse an explore feed, like posts, comment, and publish photo stories. The application uses Expo/React Native, Clerk authentication, and Convex data and file storage. Relevant evidence:

- The app is named Codexgram, is configured for iOS, Android, and static web output, and uses Expo Router: [`app.json`](../app.json#L2-L54) (name and platform configuration); [`package.json`](../package.json#L1-L54) (Expo, React Native, Clerk, Convex dependencies); [`src/app/_layout.tsx`](../src/app/_layout.tsx#L1-L30) (Clerk and Convex providers).
- Authenticated users are required for profile, post, and story operations: [`convex/lib/profiles.ts`](../convex/lib/profiles.ts#L4-L19), [`convex/posts.ts`](../convex/posts.ts#L54-L60), [`convex/stories.ts`](../convex/stories.ts#L56-L62).
- The schema stores profiles, follows, posts/media storage IDs, likes, comments, and stories: [`convex/schema.ts`](../convex/schema.ts#L4-L72).
- Feed and explore are based on posts by the user and followed profiles, plus recent posts: [`convex/posts.ts`](../convex/posts.ts#L107-L150). Suggestions are drawn from recent profiles: [`convex/profiles.ts`](../convex/profiles.ts#L66-L85).

## Accounts and authentication

- Sign-up accepts a name, email address, and password and sends an email verification code; sign-in accepts email/password. The screen also offers hosted Google and Apple sign-in: [`src/app/index.tsx`](../src/app/index.tsx#L194-L303), especially lines 215-240, 248-268, 275-289, and 296-303.
- Clerk provides the auth/session integration; Convex validates Clerk JWTs: [`src/app/_layout.tsx`](../src/app/_layout.tsx#L1-L30), [`convex/auth.config.ts`](../convex/auth.config.ts#L1-L11).
- A Convex profile is initialized from the authenticated identity and exposes username, display name, avatar, bio, and counts: [`convex/lib/profiles.ts`](../convex/lib/profiles.ts#L21-L74). Users can update username, display name, and bio; username is 3–30 lowercase letters, numbers, periods, or underscores; display name is at most 80 characters and bio at most 150: [`convex/profiles.ts`](../convex/profiles.ts#L29-L63).
- There is no age check or eligibility flow in the inspected code. No minimum age should be stated as a product fact until the operator chooses and implements one.
- The sign-up implementation contains no terms acceptance checkbox or acceptance event: [`src/app/index.tsx`](../src/app/index.tsx#L330-L459). A legal page alone does not prove that a user accepted it.

## User content, visibility, and limits

- Users supply image/video media, captions, profile details, and comments. Content and relationships are represented in the schema: [`convex/schema.ts`](../convex/schema.ts#L4-L72); posts are associated with the authenticated author: [`convex/posts.ts`](../convex/posts.ts#L63-L104); comments are associated with the signed-in author: [`convex/social.ts`](../convex/social.ts#L104-L118).
- Post reads and active story reads require a signed-in profile. The app returns media URLs and profile/post data to signed-in callers: [`convex/posts.ts`](../convex/posts.ts#L107-L166), [`convex/stories.ts`](../convex/stories.ts#L26-L53). The code does not implement public unauthenticated browsing.
- Enforced content limits: post images 10 MB; videos 50 MB and at most 60 seconds; captions 2,200 characters; stories are photos up to 10 MB and are listed only until their 24-hour `expiresAt`; comments 1,000 characters; bios 150 characters; display names 80 characters. The edit-profile screen also checks profile-photo selection at 5 MB client-side before sending the photo to Clerk. Evidence: [`convex/posts.ts`](../convex/posts.ts#L63-L89), [`convex/stories.ts`](../convex/stories.ts#L65-L85), [`convex/social.ts`](../convex/social.ts#L104-L118), [`convex/profiles.ts`](../convex/profiles.ts#L34-L48), [`src/app/edit-profile.tsx`](../src/app/edit-profile.tsx#L149-L161).
- Story expiration is a visibility cutoff in the active-story query. No scheduled removal of expired story records or their media was found: [`convex/stories.ts`](../convex/stories.ts#L26-L53), [`convex/schema.ts`](../convex/schema.ts#L64-L72). Do not promise that an expired story is automatically erased from storage.
- The repository has no implemented post-deletion mutation. Users can delete their own comments; the account deletion flow removes their posts and comments: [`convex/social.ts`](../convex/social.ts#L121-L132), [`convex/accountDeletion.ts`](../convex/accountDeletion.ts#L78-L185).
- No content moderation, user blocking, report submission, or administrator suspension/takedown workflow was found. The settings screen presents those entries as unavailable: [`src/app/(tabs)/profile/settings.tsx`](../src/app/(tabs)/profile/settings.tsx#L50-L51), [`src/app/(tabs)/profile/settings.tsx`](../src/app/(tabs)/profile/settings.tsx#L96-L112).
- The implementation does not state or decide content ownership/licensing. A service license is a contract choice and is set out in the draft for legal confirmation.

## Account deletion and termination

- Settings offers sign-out and irreversible account deletion: [`src/app/(tabs)/profile/settings.tsx`](../src/app/(tabs)/profile/settings.tsx#L51-L89), [`src/app/(tabs)/profile/settings.tsx`](../src/app/(tabs)/profile/settings.tsx#L114-L120).
- Deletion first requests Clerk to delete the authenticated user, then schedules batched Convex cleanup of that user’s comments, likes, follows, stories, posts, associated media, and profile. Each cleanup batch handles up to 50 rows: [`convex/accountDeletion.ts`](../convex/accountDeletion.ts#L30-L55), [`convex/accountDeletion.ts`](../convex/accountDeletion.ts#L58-L184).
- Cleanup is asynchronous and multi-step; deletion is not an instantaneous database erasure guarantee. The source provides no retention period for backups or logs.
- No operator-side suspension or termination mechanism was located in the repository. The draft does not represent that an in-product suspension control exists.

## Payments, AI, limits, and external services

- No billing, subscription, payment, purchase, or store-payment SDK is listed in [`package.json`](../package.json#L5-L31), and no payment flow or price appears in the inspected application/backend. Treat pricing as unconfirmed outside the repository; do not describe any specific plan or refund entitlement as an existing product fact.
- No generative AI or automated content-generation feature or AI provider integration was found in the application dependencies or source: [`package.json`](../package.json#L5-L31) lists the application dependencies, and the inspected app/backend source contains no AI provider or generation call. No AI-output terms are needed for the current implementation.
- No request-frequency, posting-frequency, or other abuse rate limiter was found. The evidence-backed limits are the per-item size/length/duration checks listed above, plus feed/query page sizes in [`convex/posts.ts`](../convex/posts.ts#L137-L166) and story result cap in [`convex/stories.ts`](../convex/stories.ts#L26-L36). These are implementation/query bounds, not account entitlements.
- Clerk handles identity, sign-up, and sessions: [`package.json`](../package.json), [`src/app/_layout.tsx`](../src/app/_layout.tsx#L1-L30), [`convex/accountDeletion.ts`](../convex/accountDeletion.ts#L30-L52). Convex handles application data, uploaded media, and backend functions: [`package.json`](../package.json), [`src/lib/convex.ts`](../src/lib/convex.ts#L1-L11), [`convex/posts.ts`](../convex/posts.ts#L54-L104).
- Demo seed code fetches sample image assets from Unsplash: [`convex/seed.ts`](../convex/seed.ts#L28-L37), [`convex/seed.ts`](../convex/seed.ts#L220-L246). Whether that seed routine is used in production and the licensing/attribution position for those assets require operator confirmation.
- The messages tab is explicitly a demo, backed by hard-coded conversations and in-memory state, with a note that demo conversations stay on-device for the session: [`src/lib/demo-messages.ts`](../src/lib/demo-messages.ts#L1-L110), [`src/app/(tabs)/messages.tsx`](../src/app/(tabs)/messages.tsx#L75-L81). It is not a server-backed messaging service. The calls, attachment, and gallery controls in the UI do not connect to a calling or media-message backend: [`src/app/chat/[username].tsx`](../src/app/chat/[username].tsx#L45-L103).

## Publication blockers and contractual choices

The app code cannot establish the contracting entity, eligible ages, jurisdiction, prices/refunds outside the app, limitation/indemnity preferences, or a service contact. These are listed separately in [`LEGAL_GAPS.md`](LEGAL_GAPS.md) and represented by bracketed placeholders in [`terms.html`](terms.html).

Before publication, also connect the app’s sign-up flow to a versioned Terms of Service and Privacy Policy, and confirm what public-facing content moderation and notice process the operator can actually support. The in-app legal links currently show an “available soon” message rather than opening a policy.
