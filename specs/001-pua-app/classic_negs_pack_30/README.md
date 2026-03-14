# classic_negs_pack_30

Seed data for the pua app. 30 classic pickup negs.

**Files**:
- `data.json` — Full JSON array (id, text, category, tone, template_type, intensity, status, …)
- `data.csv` — Same content in CSV format

**Field mapping to app schema**:
- `text` → ContentItem.text
- `category` ("classic_neg") → ContentItem.content_type ("neg")
- `status` ("approved") → ContentItem.active (true)
