# Codexgram — v1 Product and Implementation Plan

## Purpose

This document captures the agreed v1 scope and a step-by-step roadmap for a later implementation. This plan-writing task is documentation-only. Do not treat it as authorization to build the app; implementation will be requested separately.

## Product

Codexgram is a simple, modern, minimal, mobile-first social app for adults. The first release is an invite beta for up to 50 people, distributed through TestFlight and Google Play closed testing. The app is free with no ads. v1 targets iOS and Android and supports English and Urdu, including right-to-left layout for Urdu.

### v1 user experience

- Four primary tabs: **Home**, **Messages**, **Explore**, and **Profile**.
- Public profiles and posts are visible to signed-in app users.
- **Home** is a chronological feed of posts by accounts the current user follows. A create-post action on Home opens the composer.
- **Explore** searches users and provides a grid/list of recent public posts from all users.
- **Messages** contains one-to-one conversations. Users can start a conversation from Messages or another user's profile.
- **Profile** shows the current user's profile and posts, with access to profile editing and account settings.
- The Home header provides access to an in-app activity list for likes, comments, and follows.

### Account and onboarding

- Clerk handles authentication. Google and Apple are the only v1 sign-in providers; there is no email/password sign-in.
- After the first successful sign-in, require a unique username before entering the main app.
- Prefill display name and avatar from the identity provider when available. Both are editable. Users can also edit their username, bio, and avatar.
- Returning users who have completed onboarding go directly to the app.
- Profiles are public in v1; private accounts and follow requests are out of scope.

### Posts and media

- A post contains one image or one video and an optional caption. Multi-item carousels are out of scope.
- Users can choose an existing image/video or capture one with the device camera.
- Provide basic image cropping and caption entry. Filters, in-app video trimming, and advanced effects are out of scope.
- Maximum upload size: 10 MB per image and 50 MB per video. Videos are limited to 60 seconds. Compress media before upload and show upload progress, retryable failures, and clear limit errors.
- Users can delete their own posts. Signed-in users can like and comment on posts. A user may like a given post once; comments are flat and chronological, with no replies or comment likes.
- Home orders followed-account posts newest first. Explore shows recent public posts and user search; no ranking or recommendation model is required for v1.

### Following, messaging, and safety

- Following and unfollowing a public profile take effect immediately.
- Direct messages are one-to-one and support text, images, and videos. Message videos use the same 60-second and 50 MB limits as post videos. Messages update in realtime; read receipts, typing indicators, group chats, and message editing are out of scope.
- Users can delete their own comments and posts.
- Blocking hides each account's profile/posts from the other, prevents new follows and messages in either direction, and suppresses future notifications between them.
- Users can report users or content. A separate, protected web console lets an authorized admin review reports, dismiss them, or remove reported posts, comments, or accounts.
- Account deletion is self-service and removes the profile, posts, comments, likes, follows, blocks, push-device registrations, and the user's messages from every participant's history. Delete or invalidate associated media references/files where supported. This irreversible action requires a clear confirmation step.

### Notifications and connectivity

- Keep an in-app activity history for likes, comments, and follows, as well as messages in the Messages area.
- Send push notifications for new messages, likes, comments, and follows through Expo Push Service.
- Push categories are enabled by default in app preferences, subject to the operating system permission. Ask for OS permission at a contextually appropriate moment, not immediately at first launch. Provide per-category controls.
- Open a relevant profile, post, or conversation when a notification is tapped; respect blocks and deleted content when resolving destinations.
- When offline, show previously cached content read-only where available. New posts, likes, comments, follows, messages, and profile changes require connectivity; do not queue writes for later.

## Architecture and data ownership

### Existing project baseline

- Expo `~57.0.26`, Expo Router `~57.0.24`, React Native `0.86.3`, React `19.2.3`, and npm lockfile are present.
- Use Expo Router for all app navigation and NativeWind for styling, as requested.
- SDK 57 native tabs use `expo-router/unstable-native-tabs`; treat this as an unstable SDK API and verify its current SDK 57 documentation before implementation. NativeWind's current installation guide identifies v4.2.7 as supporting Expo SDK 57. Install Expo-compatible native dependencies with `npx expo install`.
- Before touching Expo, EAS, or React Native APIs, read the installed Expo major version and consult the matching versioned docs at `https://docs.expo.dev/versions/v57.0.0/`, plus the relevant linked pages. Recheck package compatibility at implementation time.

### Services and source of truth

- **Clerk:** account identity, sessions, and Google/Apple authentication.
- **Convex:** application profiles and social data, database queries/mutations/actions, realtime subscriptions, authorization checks, and media storage references/files.
- Link each Convex profile to the immutable Clerk subject. Clerk remains the identity source; Convex is authoritative for usernames and app profile/social state. Use Clerk-to-Convex authentication so Convex functions can enforce the signed-in identity.
- Use separate development and production Clerk/Convex projects. Beta builds use the production environment with tester accounts; do not share dev and production credentials.
- Keep only client-safe publishable configuration in the app. Store backend secrets and provider credentials in the appropriate service environment configuration.
- Use Expo Push Service for delivery. Store push tokens per device and associate them with the user and notification preferences; handle invalid/revoked tokens.
- Do not add third-party analytics by default. Use service logs and basic aggregate operational/error reporting; choose any additional crash/analytics vendor only if needed and document its data collection before adding it.

### Core data entities

Implement Convex tables/types and indexes sufficient for these relationships and access patterns:

- **Profiles:** Clerk subject, unique username, display name, bio, avatar reference, creation/update metadata.
- **Follows:** follower profile and followed profile; unique pair; prevent self-follow and either direction of a blocked relationship.
- **Posts:** author, image/video storage reference and metadata, optional caption, creation time, moderation/deletion state as needed.
- **Likes:** user and post; unique pair and creation time.
- **Comments:** author, post, text, creation time, and deletion/moderation state as needed; flat relationship only.
- **Conversations:** the two participant profiles and creation/last-activity metadata. Enforce exactly two distinct participants and a stable unique conversation for the participant pair.
- **Messages:** conversation, sender, text and/or media reference, creation time, and deletion/moderation state as needed. Validate that the sender is a participant.
- **Blocks:** blocker and blocked profile; unique pair.
- **Reports:** reporter, reported user and/or content reference, category/reason, submitted time, review status, and admin resolution metadata.
- **Activity notifications:** recipient, actor, activity type, target reference, creation time, and read state.
- **Notification preferences and devices:** per-user activity category settings and per-device push token/platform metadata.

Use storage references rather than embedding media bytes in database documents. Establish indexes for username lookup, feed ordering, profile posts, likes/comments per post, conversations/messages, activity history, reports by status, and push devices per user.

### Authorization boundaries

- Enforce access in Convex functions, not only by hiding UI controls.
- A signed-in user may edit only their own profile, delete only their own posts/comments, and create likes/comments/follows/messages as themselves.
- Only conversation participants can read or send to that conversation. Validate all media references and ensure actions cannot mutate another user's content.
- Blocks must be checked across feed/discovery visibility, follow, messaging, and notification creation/delivery paths.
- Admin report actions require an explicit protected admin role/allowlist and server-side authorization. Never trust a client-provided admin flag.
- Account deletion must be idempotent or safely resumable so partial failures do not leave private identity/media references accessible. Define cleanup handling for storage items and third-party push tokens.

## Step-by-step implementation roadmap

1. **Repository and service setup**
   - Preserve existing project changes. Document required Clerk and Convex dev/prod variables and setup steps without committing credentials.
   - Recheck SDK 57 docs for Clerk Expo, Convex React Native integration, native tabs, media picker/camera, notifications, localization, and NativeWind compatibility before adding packages or native configuration.
   - Add or update dependency/configuration files only as required for the selected compatible integrations. Since the project uses npm, use Expo's installer for Expo-compatible native packages.

2. **App shell, styling, and navigation**
   - Configure NativeWind, shared design tokens, safe areas, keyboard handling, and reusable loading/error/empty states.
   - Build the root auth-aware layout, native four-tab navigator, and stack routes for onboarding, profile details, post details/composer, conversation threads, activity, and settings.
   - Confirm native tab behavior and accessible labels/icons on iOS and Android.

3. **Authentication and profile onboarding**
   - Integrate Clerk with secure session persistence appropriate to Expo 57 and Convex's Clerk auth provider.
   - Configure Google and Apple sign-in, redirect/deep-link behavior, loading, cancellation, and error states.
   - Implement profile bootstrap and required unique username selection. Import provider name/avatar as editable defaults; support later profile edits.

4. **Convex schema, authorization, and profiles**
   - Add core schema, indexes, and authenticated queries/mutations for profiles and username lookup.
   - Verify case normalization and handle uniqueness rules; see assumptions below.
   - Add self-profile, other-user profile, user search, profile post grid, follower/following lists, and profile edit states.

5. **Media uploads, posts, and feeds**
   - Implement photo/video selection and camera capture using SDK 57-compatible Expo APIs and required permissions.
   - Enforce file type, size, and duration limits; compress before upload; show progress, cancellation/retry where supported, and cleanup of abandoned uploads.
   - Build post composer with image crop/caption, post detail, delete-own-post action, chronological followed feed, recent global Explore grid, and loading/empty/error states.

6. **Social interactions and discovery**
   - Implement follow/unfollow, unique likes, flat comments, ownership-based deletion, and appropriate optimistic UI with rollback on failure.
   - Implement user search and post discovery query/index behavior; paginate long feeds and result lists for mobile performance.
   - Add block checks consistently to profile visibility, feed results, actions, conversations, and notifications.

7. **Messaging**
   - Implement conversation creation/opening from Messages and profiles, message history pagination, realtime updates, and text/media send states.
   - Apply the same video size/duration limits to chat; prevent access by nonparticipants; handle offline send errors without pretending messages were delivered.
   - Ensure account deletion removes the deleted sender's messages from all participants' views.

8. **Reports, admin review, activity, and push**
   - Implement report submission and a distinct protected web admin queue with review, dismiss, and content/account removal actions.
   - Implement activity records, category preference controls, device token registration/removal, and Expo Push delivery through backend-controlled work.
   - Handle retries/idempotency for push sends, invalid tokens, notification taps, deleted targets, and blocked/deleted actors. Push failure must not roll back the underlying social action.

9. **Account lifecycle, localization, and offline behavior**
   - Implement self-service account deletion and related Convex/storage/push cleanup with progress, confirmation, and recoverable failure behavior.
   - Localize all user-facing strings in English and Urdu; support RTL layout, text alignment, and directional icons as appropriate.
   - Verify cached read behavior and show clear offline/connection state; keep writes disabled or explicitly failed while offline.

10. **Beta readiness and release**
    - Configure production app identifiers, Clerk/Convex production environments, EAS build profiles, TestFlight, and Google Play closed testing.
    - Add basic operational logging/error visibility and service usage alerts. Document report-review operations and tester feedback path.
    - Complete the acceptance checks below before inviting up to 50 beta users.

## Acceptance and verification checklist

- Google and Apple sign-in, cancellation/retry, first-time handle setup, username conflict, returning session, sign-out, and deleted-account behavior work on iOS and Android.
- Profile creation/editing and provider defaults work; username uniqueness is enforced by Convex even under concurrent requests.
- Home includes only followed, visible accounts and is newest-first; Explore finds users and displays recent public posts; pagination and empty states work.
- Photo/video picker and camera permissions behave correctly; image/video size and duration limits are enforced; upload progress/failure/retry and unsupported media are clear.
- Users can create/delete their own posts and comments, cannot delete others' content, cannot create duplicate likes, and can follow/unfollow with correct feed state.
- Blocking prevents mutual discovery, follows, messaging, and notifications; report submission and admin-only review/removal authorization are enforced server-side.
- Only participants can read/send messages; realtime updates work; image/video messages obey limits; deleted-user messages disappear for all participants.
- Activity entries/preferences and push delivery behave correctly. Permission denial, invalid tokens, provider failure, deleted targets, and notification navigation have graceful outcomes.
- Account deletion handles posts, comments, reactions, follows, blocks, conversations/messages, push registrations, and media cleanup without exposing partial data.
- English/Urdu strings and RTL layout are reviewed on both platforms. Offline cached reads are usable and writes fail clearly without network.
- Manually verify the core user journeys on iOS and Android, and add automated backend tests for identity, ownership, participant, block, uniqueness, deletion, and admin authorization rules.

## Assumptions and open risks

- “Public” means visible to signed-in users in the iOS/Android app; anonymous web access is out of scope.
- Public follows are immediate. A user can like each post once. Comments are flat and chronological.
- A user can initiate a one-to-one chat from a profile or from Messages. No group conversation or message read state exists in v1.
- Username matching should be case-insensitive and normalized; confirm the exact allowed characters/length before implementation if branding/product requirements need a different rule.
- Provider name/avatar may be absent; onboarding must allow manual display-name entry and an empty avatar.
- Push category settings default on in app state, but actual delivery requires OS permission.
- Exact target country, privacy/legal requirements, and data-retention obligations are not yet specified; confirm before public launch.
- Free-tier storage/bandwidth and push quotas may be insufficient if video uploads/views are frequent. Measure usage, set alerts, and revisit limits before growing beyond the initial beta.
- The separate admin console's web framework/hosting and admin provisioning method are not selected. Preserve its protected boundary and choose an implementation compatible with the existing service/auth setup.
- Analytics/crash reporting vendor is not selected; begin with service logs and minimal aggregate operational signals, and avoid user-level behavioral analytics unless explicitly approved later.
- Expo Router native tabs are marked unstable for SDK 57; verify on both platforms before relying on advanced tab customization.

## Reference docs to recheck during implementation

- Expo SDK 57 docs: <https://docs.expo.dev/versions/v57.0.0/>
- Expo Router native tabs guide: <https://docs.expo.dev/router/advanced/native-tabs/>
- Clerk Expo quickstart: <https://clerk.com/docs/expo/getting-started/quickstart>
- Convex and Clerk: <https://docs.convex.dev/auth/clerk>
- NativeWind installation and SDK 57 compatibility: <https://www.nativewind.dev/docs/getting-started/installation>
