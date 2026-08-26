#!/usr/bin/env bash
#
# Resize/convert a player photo to a web-ready .webp, copy it into the
# spurs-women-photo-gallery repo, commit + push it, then update the
# player's profile_image_url in Supabase to the resulting CDN URL.
#
# Usage: ./player-photo-optimiser.sh "Player Name" [player-uuid]
#   e.g. ./player-photo-optimiser.sh "Bethany England"
#
# The optional second argument is the player's Supabase `players.id` UUID,
# needed only if the first/last name lookup is ambiguous or fails.
#
# Expects the source photo at:
#   /Users/elliematthewman/Desktop/SpursWomen/Images/Players/<player-name-slug>.jpg
#
# Reads Supabase credentials from .env.local in the portfolio repo root
# (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()    { echo -e "${BLUE}==>${NC} $1"; }
success() { echo -e "${GREEN}✔${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠${NC} $1"; }
error()   { echo -e "${RED}✘${NC} $1" >&2; }

if [[ $# -lt 1 || $# -gt 2 ]]; then
  error "Usage: $0 \"Player Name\" [player-uuid]"
  exit 1
fi

PLAYER_NAME="$1"
PLAYER_ID="${2:-}"

# "Bethany England" -> "bethany-england"
# "Celin Bizet Ildhusøy" -> "celin-bizet-ildhusoy" (transliterated, not dropped -
# iconv//TRANSLIT is unreliable on macOS's BSD iconv, hence the explicit table)
SLUG=$(echo "$PLAYER_NAME" \
  | sed \
    -e 's/[áàâäã]/a/g' -e 's/[ÁÀÂÄÃ]/A/g' \
    -e 's/å/a/g' -e 's/Å/A/g' \
    -e 's/æ/ae/g' -e 's/Æ/Ae/g' \
    -e 's/ç/c/g' -e 's/Ç/C/g' \
    -e 's/[éèêë]/e/g' -e 's/[ÉÈÊË]/E/g' \
    -e 's/[íìîï]/i/g' -e 's/[ÍÌÎÏ]/I/g' \
    -e 's/ñ/n/g' -e 's/Ñ/N/g' \
    -e 's/[óòôöõø]/o/g' -e 's/[ÓÒÔÖÕØ]/O/g' \
    -e 's/œ/oe/g' -e 's/Œ/Oe/g' \
    -e 's/[úùûü]/u/g' -e 's/[ÚÙÛÜ]/U/g' \
    -e 's/[ýÿ]/y/g' -e 's/[ÝŸ]/Y/g' \
  | tr '[:upper:]' '[:lower:]' \
  | tr ' ' '-' \
  | tr -s '-' \
  | tr -cd 'a-z0-9-' \
  | sed 's/^-*//;s/-*$//')

if [[ -z "$SLUG" ]]; then
  error "Could not derive a filename slug from \"$PLAYER_NAME\""
  exit 1
fi

IMAGES_DIR="/Users/elliematthewman/Desktop/SpursWomen/Images/Players"
SOURCE_JPG="$IMAGES_DIR/$SLUG.jpg"
OUTPUT_WEBP="$IMAGES_DIR/$SLUG.webp"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORTFOLIO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
GALLERY_REPO="$(dirname "$PORTFOLIO_ROOT")/spurs-women-photo-gallery"

ENV_FILE="$PORTFOLIO_ROOT/.env.local"
GITHUB_OWNER="EllieAtWHL"
GALLERY_REPO_NAME="spurs-women-photo-gallery"
CDN_URL="https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${GALLERY_REPO_NAME}@main/player-photos/${SLUG}.webp"

if ! command -v magick >/dev/null 2>&1; then
  error "ImageMagick's 'magick' command isn't on PATH (brew install imagemagick)"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  error "'jq' is required to update Supabase but isn't on PATH (brew install jq)"
  exit 1
fi

if [[ ! -f "$SOURCE_JPG" ]]; then
  error "No source photo found at $SOURCE_JPG"
  exit 1
fi

if [[ ! -d "$GALLERY_REPO/.git" ]]; then
  error "Photo gallery repo not found at $GALLERY_REPO"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  error "Missing $ENV_FILE — can't read Supabase credentials"
  exit 1
fi

SUPABASE_URL=$(grep -m1 '^NEXT_PUBLIC_SUPABASE_URL=' "$ENV_FILE" | cut -d '=' -f2-)
SUPABASE_SERVICE_ROLE_KEY=$(grep -m1 '^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE" | cut -d '=' -f2-)

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
  error "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set in $ENV_FILE"
  exit 1
fi

info "Optimising photo for $PLAYER_NAME..."
magick "$SOURCE_JPG" -resize 800x800^ -gravity center -extent 800x800 -strip -quality 82 "$OUTPUT_WEBP"
success "Created $OUTPUT_WEBP"

info "Copying into $GALLERY_REPO/player-photos/"
cp "$OUTPUT_WEBP" "$GALLERY_REPO/player-photos/$SLUG.webp"

cd "$GALLERY_REPO"
git add "player-photos/$SLUG.webp"

if git diff --cached --quiet; then
  warn "No changes to commit — $SLUG.webp is already up to date in the gallery repo"
else
  git commit -m "Add profile photo for $PLAYER_NAME"
  success "Committed photo for $PLAYER_NAME"

  info "Pushing to origin main..."
  git push origin main
  success "Pushed to $GALLERY_REPO_NAME"
fi

if [[ -z "$PLAYER_ID" ]]; then
  FIRST_NAME="${PLAYER_NAME%% *}"
  LAST_NAME="${PLAYER_NAME#* }"

  if [[ "$FIRST_NAME" == "$LAST_NAME" ]]; then
    error "Couldn't split \"$PLAYER_NAME\" into first/last name for a Supabase lookup — re-run with the player's UUID as a second argument"
    exit 1
  fi

  info "Looking up $PLAYER_NAME in Supabase..."
  MATCHES=$(curl -sS -G "$SUPABASE_URL/rest/v1/players" \
    --data-urlencode "first_name=eq.$FIRST_NAME" \
    --data-urlencode "last_name=eq.$LAST_NAME" \
    --data-urlencode "select=id,first_name,last_name" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

  MATCH_COUNT=$(echo "$MATCHES" | jq 'length')

  if [[ "$MATCH_COUNT" -eq 0 ]]; then
    error "No player found matching first_name=\"$FIRST_NAME\" last_name=\"$LAST_NAME\" in Supabase. The photo has been pushed, but profile_image_url was NOT updated — set it manually or re-run with the player's UUID as a second argument."
    exit 1
  elif [[ "$MATCH_COUNT" -gt 1 ]]; then
    error "Multiple players matched \"$PLAYER_NAME\" — the photo has been pushed, but profile_image_url was NOT updated. Re-run with one of these UUIDs as a second argument:"
    echo "$MATCHES" | jq -r '.[] | "  \(.id)  \(.first_name) \(.last_name)"' >&2
    exit 1
  fi

  PLAYER_ID=$(echo "$MATCHES" | jq -r '.[0].id')
fi

info "Updating profile_image_url for player $PLAYER_ID..."
UPDATE_RESPONSE=$(curl -sS -w '\n%{http_code}' -X PATCH "$SUPABASE_URL/rest/v1/players?id=eq.$PLAYER_ID" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "$(jq -n --arg url "$CDN_URL" '{profile_image_url: $url}')")

HTTP_CODE=$(echo "$UPDATE_RESPONSE" | tail -n1)
BODY=$(echo "$UPDATE_RESPONSE" | sed '$d')

if [[ "$HTTP_CODE" != "200" && "$HTTP_CODE" != "204" ]]; then
  error "Supabase update failed (HTTP $HTTP_CODE): $BODY. The photo has been pushed, but profile_image_url was NOT updated."
  exit 1
fi

if [[ "$(echo "$BODY" | jq 'length')" -eq 0 ]]; then
  error "Supabase update matched no rows for id=$PLAYER_ID. The photo has been pushed, but profile_image_url was NOT updated."
  exit 1
fi

success "Updated profile_image_url -> $CDN_URL"
