#!/usr/bin/env bash
# Idempotent: adds $DOMAIN to the Pages project and creates its proxied CNAME.
# Never edits a DNS record it did not create: an existing record pointing
# somewhere else stops the job instead.
set -euo pipefail
API=https://api.cloudflare.com/client/v4
api() { curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" "$@"; }

target=$(api "$API/accounts/$ACCOUNT/pages/projects/$PROJECT" | jq -r '.result.subdomain // empty')
[ -n "$target" ] || { echo "Pages project $PROJECT not readable"; exit 1; }
echo "Pages subdomain: $target"

domains=$(api "$API/accounts/$ACCOUNT/pages/projects/$PROJECT/domains")
if echo "$domains" | jq -e --arg d "$DOMAIN" '.result[]? | select(.name == $d)' >/dev/null; then
  echo "$DOMAIN already on the project: $(echo "$domains" | jq -c --arg d "$DOMAIN" '.result[] | select(.name == $d) | {status, verification_data, validation_data}')"
else
  api -X POST "$API/accounts/$ACCOUNT/pages/projects/$PROJECT/domains" -d "{\"name\":\"$DOMAIN\"}" | jq -c '{success, errors, status: .result.status}'
fi

zone=$(api "$API/zones?name=$ZONE" | jq -r '.result[0].id // empty')
[ -n "$zone" ] || { echo "Zone $ZONE not readable with this token"; exit 1; }
existing=$(api "$API/zones/$zone/dns_records?name=$DOMAIN")
count=$(echo "$existing" | jq '.result | length')
if [ "$count" = "0" ]; then
  api -X POST "$API/zones/$zone/dns_records" \
    -d "{\"type\":\"CNAME\",\"name\":\"$DOMAIN\",\"content\":\"$target\",\"proxied\":true,\"ttl\":1,\"comment\":\"Cloudflare Pages $PROJECT (newsroom, GitHub radioindex.org-news)\"}" \
    | jq -c '{success, errors, id: .result.id}'
else
  echo "$existing" | jq -c '.result[] | {type, name, content, proxied}'
  current=$(echo "$existing" | jq -r '.result[0].content')
  if [ "$current" != "$target" ]; then echo "DNS for $DOMAIN points at $current, not $target; leaving it alone"; exit 1; fi
fi
