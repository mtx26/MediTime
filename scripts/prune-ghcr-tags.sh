#!/usr/bin/env bash
#
# Nettoyage des versions publiées de ghcr.io/mtx26/meditime-backend.
#
# PRÉREQUIS — le token gh doit porter le scope delete:packages :
#   gh auth refresh -h github.com -s read:packages -s delete:packages
#
# UTILISATION :
#   bash scripts/prune-ghcr-tags.sh            # simulation (par défaut, ne supprime rien)
#   bash scripts/prune-ghcr-tags.sh --apply    # suppression réelle
#   bash scripts/prune-ghcr-tags.sh --apply --prune-sha 10   # + purge des sha-* orphelins, garde les 10 plus récents
#
# POURQUOI CE SCRIPT PLUTÔT QUE DES SUPPRESSIONS À LA MAIN
# --------------------------------------------------------
# Sur GHCR l'unité de suppression est la VERSION (un digest), pas le tag.
# Plusieurs tags partagent souvent un digest : ici `latest`, `login` et
# `sha-8db64a1` pointent tous sur sha256:8df304b3... Supprimer « le tag login »
# depuis l'interface web détruit donc aussi `latest`, que la production tire
# via BACKEND_IMAGE (docker-compose.yml).
#
# Ce script refuse catégoriquement de toucher à une version taguée `latest`.

set -euo pipefail

PACKAGE="meditime-backend"
PROTECTED_TAGS=("latest" "main")

# Tags de branches de travail à retirer du registre public.
# `login` n'y figure pas : il partage son digest avec `latest` et ne peut pas
# être supprimé séparément (voir plus bas).
REMOVABLE_TAGS=(
  "monorepo-v2"
  "copilot-fix-worker-process-exception"
  "copilot-fix-invalid-uuid-syntax"
  "Missed-Intakes"
  "fix-fcm-notification"
  "react-native-app"
)

APPLY=false
PRUNE_SHA=0
while [ $# -gt 0 ]; do
  case "$1" in
    --apply) APPLY=true; shift ;;
    --prune-sha) PRUNE_SHA="${2:-0}"; shift 2 ;;
    *) echo "option inconnue : $1" >&2; exit 2 ;;
  esac
done

if ! gh auth status >/dev/null 2>&1; then
  echo "gh n'est pas authentifié. Lancez : gh auth login" >&2
  exit 1
fi

# Endpoints SANS slash initial : sous Git Bash / MSYS, un argument commençant par
# "/" est converti en chemin Windows ("C:/Program Files/Git/user/packages/...")
# et gh rejette l'appel. gh accepte la forme sans slash sur toutes les plateformes.
if ! gh api "user/packages/container/${PACKAGE}/versions?per_page=1" >/dev/null 2>&1; then
  echo "Accès refusé à l'API packages." >&2
  echo "Ajoutez LES DEUX scopes (read seul ne suffit pas pour supprimer) :" >&2
  echo "  gh auth refresh -h github.com -s read:packages -s delete:packages" >&2
  exit 1
fi

echo "Récupération des versions de ${PACKAGE}..."
VERSIONS_JSON="$(gh api --paginate "user/packages/container/${PACKAGE}/versions?per_page=100")"

# Les listes transitent par l'environnement, pas par des fichiers dans /tmp :
# sous Git Bash, /tmp est un chemin MSYS que le Python de Windows lit comme
# C:\tmp et ne trouve pas.
PROTECTED_STR="$(printf '%s\n' "${PROTECTED_TAGS[@]}")"
REMOVABLE_STR="$(printf '%s\n' "${REMOVABLE_TAGS[@]}")"
export VERSIONS_JSON APPLY PRUNE_SHA PROTECTED_STR REMOVABLE_STR

python - <<'PYEOF'
import json, os, subprocess, sys

pkg = "meditime-backend"
apply_ = os.environ["APPLY"] == "true"
prune_sha = int(os.environ["PRUNE_SHA"])
protected = {l.strip() for l in os.environ["PROTECTED_STR"].splitlines() if l.strip()}
removable = {l.strip() for l in os.environ["REMOVABLE_STR"].splitlines() if l.strip()}

raw = os.environ["VERSIONS_JSON"]
# --paginate concatène les tableaux JSON ; on les recolle.
decoder, versions, idx = json.JSONDecoder(), [], 0
while idx < len(raw):
    while idx < len(raw) and raw[idx] in ' \n\r\t':
        idx += 1
    if idx >= len(raw):
        break
    obj, idx = decoder.raw_decode(raw, idx)
    versions.extend(obj if isinstance(obj, list) else [obj])

def tags_of(v):
    return v.get("metadata", {}).get("container", {}).get("tags", []) or []

to_delete, kept, blocked = [], [], []
for v in versions:
    tags = set(tags_of(v))
    if tags & protected:
        # Cœur du garde-fou : une version taguée latest n'est jamais touchée,
        # même si elle porte par ailleurs un tag de branche à nettoyer.
        if tags & removable:
            blocked.append((v, sorted(tags)))
        else:
            kept.append((v, sorted(tags)))
        continue
    if tags & removable:
        to_delete.append((v, sorted(tags)))
    else:
        kept.append((v, sorted(tags)))

if prune_sha > 0:
    orphans = [(v, t) for v, t in kept
               if t and all(x.startswith("sha-") for x in t) and not (set(t) & protected)]
    orphans.sort(key=lambda x: x[0].get("created_at", ""), reverse=True)
    extra = orphans[prune_sha:]
    to_delete.extend(extra)
    ids = {v["id"] for v, _ in extra}
    kept = [(v, t) for v, t in kept if v["id"] not in ids]

print(f"\n{len(versions)} versions au total\n")
if blocked:
    print("PROTÉGÉES — tag de branche partageant le digest de latest :")
    for v, t in blocked:
        print(f"  {v['name'][:19]}  {t}")
    print("  -> non supprimables sans détruire latest. Pour retirer ces tags,")
    print("     republiez latest depuis main : le tag de branche sera alors orphelin.\n")

print(f"À SUPPRIMER ({len(to_delete)}) :")
for v, t in to_delete:
    print(f"  {v['name'][:19]}  {t}  {v.get('created_at','')[:10]}")
if not to_delete:
    print("  (aucune)")

print(f"\nCONSERVÉES ({len(kept)}) :")
for v, t in sorted(kept, key=lambda x: x[0].get('created_at',''), reverse=True)[:12]:
    print(f"  {v['name'][:19]}  {t}  {v.get('created_at','')[:10]}")
if len(kept) > 12:
    print(f"  ... et {len(kept)-12} autres")

if not apply_:
    print("\n[SIMULATION] Rien n'a été supprimé. Relancez avec --apply pour exécuter.")
    sys.exit(0)

print("\nSuppression en cours...")
failed = 0
for v, t in to_delete:
    # Idem : pas de slash initial, sinon MSYS réécrit l'endpoint en chemin Windows.
    r = subprocess.run(
        ["gh", "api", "-X", "DELETE", f"user/packages/container/{pkg}/versions/{v['id']}"],
        capture_output=True, text=True)
    if r.returncode == 0:
        print(f"  supprimé : {t}")
    else:
        failed += 1
        print(f"  ECHEC    : {t} -> {r.stderr.strip()[:110]}")
print(f"\n{len(to_delete)-failed} supprimée(s), {failed} échec(s).")
PYEOF
