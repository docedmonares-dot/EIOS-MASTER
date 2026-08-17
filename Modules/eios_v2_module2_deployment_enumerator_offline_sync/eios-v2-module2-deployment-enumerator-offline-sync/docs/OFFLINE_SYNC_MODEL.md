# Offline Sync Model

## Local States

- Draft
- Final Locked Unsynced
- Syncing
- Synced
- Failed
- Conflict
- Rejected

## Rules

1. Drafts may be edited.
2. Final submitted records are locked.
3. Locked records cannot be edited by enumerator.
4. Locked unsynced records remain stored offline.
5. When internet returns, records are synced.
6. Sync failure must not delete local record.
7. Successful sync marks local record as synced.
8. Duplicate server response must be handled safely.

## IndexedDB Stores

- responses
- packages
- assignments
- logs
