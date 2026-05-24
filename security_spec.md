# Security Specification for Glidrovia Firestore

## Data Invariants
1. A user can only create their own profile document (`/users/{uid}`).
2. A user can only update their own profile document.
3. RBAC fields like `role` can only be set/modified by an admin.
4. Currencies (`robux`, `tokens`, `drovis`) should only be modified via controlled logic (though in this specific app, they seem to be modified in client, I will add guards to prevent arbitrarily high values if possible, or usually these should be server-side).
5. Reports can be created by any authenticated user but never modified or deleted by them.
6. `creatorUid` in games/videos must match the authenticated user.
7. `createdAt` must be `request.time`.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to create a user profile with a different `uid` in the path than the auth token.
   - Path: `/users/hacker_uid`
   - Payload: `{ "uid": "victim_uid", "username": "hacker" }`
   - Expected: `PERMISSION_DENIED`

2. **Privilege Escalation**: Attempt to set `role: "admin"` during user creation.
   - Path: `/users/current_uid`
   - Payload: `{ "uid": "current_uid", "username": "hacker", "role": "admin" }`
   - Expected: `PERMISSION_DENIED`

3. **Currency Injection**: Attempt to set `robux: 999999` during creation or update.
   - Path: `/users/current_uid`
   - Payload: `{ "uid": "current_uid", "username": "hacker", "robux": 999999 }`
   - Expected: `PERMISSION_DENIED` (if guarded)

4. **Orphaned Report**: Attempt to create a report with a `reporterUid` that doesn't match the current user.
   - Path: `/reports/new_id`
   - Payload: `{ "reporterUid": "victim_uid", "targetId": "xyz", ... }`
   - Expected: `PERMISSION_DENIED`

5. **Creator Impersonation (Games)**: Create a game with a `creatorUid` matching a victim.
   - Path: `/games/game_1`
   - Payload: `{ "id": "game_1", "creatorUid": "victim_uid", ... }`
   - Expected: `PERMISSION_DENIED`

6. **Terminal State Bypass**: Attempt to resolve a report (`status: "resolved"`) as a regular user.
   - Path: `/reports/report_1`
   - Payload: `{ "status": "resolved" }`
   - Expected: `PERMISSION_DENIED`

7. **Shadow Field Injection**: Add a field `isPremium: true` to a user profile that isn't in the schema.
   - Path: `/users/current_uid`
   - Payload: { ..., "isPremium": true }
   - Expected: `PERMISSION_DENIED`

8. **Future Timestamp**: Set `createdAt` to a future date.
   - Path: `/reports/new_id`
   - Payload: { ..., "createdAt": "2030-01-01T00:00:00Z" }
   - Expected: `PERMISSION_DENIED`

9. **Long ID Bombing**: Attempt to create a document with an ID that is too long (e.g., 2000 chars).
   - Path: `/users/{2000_char_id}`
   - Expected: `PERMISSION_DENIED`

10. **Global Config Hijack**: Regular user trying to update `global_settings/main`.
    - Path: `/global_settings/main`
    - Expected: `PERMISSION_DENIED`

11. **Username Takeover**: Update `users_by_username/victim` as a different user.
    - Path: `/users_by_username/victim`
    - Expected: `PERMISSION_DENIED`

12. **Mass Scrape**: Attempt to `list` all users without identifying filters (if we want to restrict this, though social apps often allow searching).
    - Expected: `PERMISSION_DENIED` (if the rule requires owner check or specific limit)
