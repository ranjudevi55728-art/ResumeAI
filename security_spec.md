# Security Specification for ResumeAI

This specification defines the security invariants and threat vectors for the Firestore database of **ResumeAI**. 

## 1. Core Data Invariants
- **Owner Security**: A user can only read, create, update, or delete resumes and cover letters where `userId` matches their unique authenticated user ID (`request.auth.uid`).
- **Data Completeness**: Resume creation must contain critical identifier fields: `userId`, `title`, and `templateId`.
- **System Integrity**: User cannot set `isPremium` or modify other admin attributes bypassing checkout, though resumes might possess custom flags. 

## 2. Dirty Dozen Threat Payloads
The following payloads attempt to bypass identity or schema constraints and must be rejected:

1. **Anonymous Read**: Attempting to read a resume when not logged in.
2. **Identity Spoofing**: Logged-in user `user_A` trying to create a resume with `userId` as `user_B`.
3. **Cross-Tenant View**: Logged-in user `user_A` trying to read `user_B`'s resume document.
4. **Cross-Tenant Modify**: Logged-in user `user_A` trying to update keys on `user_B`'s resume.
5. **Cross-Tenant Delete**: Logged-in user `user_A` trying to delete `user_B`'s cover letter.
6. **Path Poisoning**: Injecting an extremely long, malicious string as a document ID to hijack routing logic.
7. **Bypassing Server Metadata**: Sending an update to a terminal state or modifying someone else's document.
8. **Malicious Giant Fields**: Uploading lists filled with 10,000 blank entries to exhaust storage bounds.
9. **Unverified Account Write**: Creating a resume from an email address whose status is unverified (if mandatory).
10. **Ghost Fields injection**: Injecting unsupported roles like `{ "isAdmin": true }` to user metadata.
11. **Timestamp Spoofing**: Supplying a client-side generated `createdAt` instead of a true Firestore `request.time` server timestamp.
12. **Blank Title Update**: Updating a resume's title to empty string or null when it's required to have a minimum length.

## 3. Rules Implementation Strategy
The actual security rules will be generated in `firestore.rules` and deployed via `deploy_firebase`. The rules will strictly validate incoming client data against:
- `request.auth.uid == resource.data.userId`
- `isValidResume` validation function checking types and bounds.
