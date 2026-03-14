# API Contract: pua

**Branch**: `001-pua-app` | **Date**: 2025-03-14

Base URL: `/api` (or configured prefix)

---

## GET /content

Returns one random active content item. Optionally excludes a specific item (for no-repeat-in-row).

### Request

| Query Param | Type   | Required | Description                          |
|-------------|--------|----------|--------------------------------------|
| exclude_id  | integer| No       | Content item ID to exclude from result |

### Response 200

```json
{
  "id": 1,
  "text": "Example one-liner text.",
  "content_type": "one_liner",
  "created_at": "2025-03-14T12:00:00Z"
}
```

### Response 404

When no active content exists (or all excluded):

```json
{
  "detail": "No content available"
}
```

---

## POST /votes

Records a thumbs up or thumbs down vote for a content item.

### Request

| Header   | Value        | Description        |
|----------|--------------|--------------------|
| Content-Type | application/json | Required |

Body:

```json
{
  "content_item_id": 1,
  "vote_type": "up",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field          | Type   | Required | Description                    |
|----------------|--------|----------|--------------------------------|
| content_item_id| integer| Yes      | ID of the content item voted on |
| vote_type      | string | Yes      | `"up"` or `"down"`             |
| session_id     | string | Yes      | UUID of anonymous session      |

### Response 201

```json
{
  "id": 1,
  "content_item_id": 1,
  "vote_type": "up",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-03-14T12:00:01Z"
}
```

### Response 400

Validation error (invalid vote_type, missing fields, invalid session_id format):

```json
{
  "detail": [
    {
      "loc": ["body", "vote_type"],
      "msg": "value is not a valid enumeration member",
      "type": "type_error.enum"
    }
  ]
}
```

### Response 422

Debounced duplicate vote (same item + session within 1-second window):

```json
{
  "detail": "Duplicate vote ignored"
}
```

### Response 500

Server error (e.g. DB write failure):

```json
{
  "detail": "Failed to persist vote"
}
```
