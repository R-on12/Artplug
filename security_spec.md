# Security Specification for Artplug

## Data Invariants
1. An artwork must have a valid price and image URL.
2. An application must be linked to the applying user's UID.
3. Status of an application can only be changed by an admin.
4. User profiles can only be updated by the owner (except for role changes).
5. Timestamps must be server-generated.

## The "Dirty Dozen" Payloads (Red Team Test Cases)

1. **Identity Spoofing**: Attempt to create an application with a different `userId` than the authenticated user.
2. **Privilege Escalation**: Attempt to update a user profile to set `role: 'admin'`.
3. **State Shortcutting**: Attempt to create an application with `status: 'approved'`.
4. **Data Poisoning**: Attempt to inject 1MB string into `artworkId`.
5. **PII Leak**: Attempt to read the `users` collection as an unauthenticated user.
6. **Bypassing Validation**: Attempt to create an artwork with a negative price (if price was numeric) or missing `image`.
7. **Shadow fields**: Attempt to add `isFeatured: true` to an artwork create call when not allowed.
8. **Malicious Update**: Attempt to change the `artistName` of someone else's application.
9. **Timestamp Spoofing**: Attempt to set `createdAt` to a date in the past.
10. **Orphaned Write**: Attempt to create an artwork without a valid `artist` name.
11. **Query Scraping**: Attempt to list all applications without being an admin.
12. **Deletion Attack**: Attempt to delete an artwork as a non-owner/non-admin.

## Test Runner logic (Mock)
(Tests would be implemented in `firestore.rules.test.ts` using the Firebase Rules Emulator)
