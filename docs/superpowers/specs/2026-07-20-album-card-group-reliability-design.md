# Album, Card, and Group Reliability Design

## Scope

This change fixes photo deletion from the travel album, prevents character
artwork from being cropped, and makes the existing travel group workflow
truthful and safe when cloud synchronization is available or unavailable.

## Album Deletion

Every album photo will retain stable source metadata: its city, category,
source index, source type, and underlying cloud file identifier. A long press
on a personal photo opens an explicit destructive-action confirmation. A
confirmed deletion updates the in-memory photo map, local storage, album
statistics, city filters, and rendered grid in one operation.

When the photo is cloud-backed, the client also asks `syncData.removePhoto` to
remove the database record and `wx.cloud.deleteFile` to remove the stored file.
The local removal remains successful if cloud cleanup is temporarily
unavailable; a pending cleanup marker is retained and retried on subsequent
synchronization. Group-shared photos are read-only to members other than their
owner, so their long-press action explains that the owner must remove them.

Photo identity is normalized from either legacy string records or the richer
photo record already emitted by the uploader. This keeps existing users'
albums compatible.

## Character Artwork

The detail page uses a full-art presentation instead of cropping to fill a
fixed container. The foreground image is rendered with `aspectFit` above a
rarity-aware backdrop; its container uses a stable portrait card ratio. Labels
stay on the stage without obscuring the artwork. If the cloud image cannot be
resolved, the existing fallback illustration remains visible.

## Group Reliability

The group remains a single-group experience, backed by the `group` cloud
function. The implementation establishes these rules:

- A deleted personal photo is also removed from the group photo wall.
- Group photo deletion is authorized only for the original uploader.
- Leaving a group deletes only that member's records for that group; it must
  never touch memberships or records in other groups.
- A creator cannot leave an active group without transferring ownership to an
  existing member. A one-member group may be dissolved instead.
- When the cloud function is unavailable, group creation and join are labelled
  as local-only drafts. They do not claim that friends can see or join them.
- The group screen presents a synchronization state and refreshes local cache
  only with results from the current group API.

## Error Handling

Destructive actions require confirmation. UI state is updated optimistically
only after the local data write succeeds; cloud cleanup failures surface a
non-blocking notice and are queued for retry. Failed ownership transfers or
member authorization checks leave the existing group unchanged.

## Tests

Tests cover normalizing album identities, removing a personal local/cloud photo,
protecting a group photo from non-owners, preserving the last valid album
filter after deletion, and group leave/transfer authorization. Presentation
checks verify that the card template uses `aspectFit` and an explicit portrait
stage.

## Delivery Boundary

This iteration implements the reliability foundation. Future optional work may
add city-level group contributions and team progress (option 2), or wishes,
missions, and moderated comments (option 3). Neither expansion is included in
this implementation.
