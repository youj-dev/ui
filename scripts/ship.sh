#!/bin/zsh
# Ship main to production on Cloudflare (Worker `youj` at www.youj.dev): behind the stealth gate until launch, public after.
# Production is deployed only from here; staging (youj-staging at staging.youj.dev) deploys itself
# from Cloudflare Workers Builds on every push to main (apps/docs/docs/hosting.md).
#
#   scripts/ship.sh              verify what the change since the last ship touches, build once, deploy
#   scripts/ship.sh --full       every package's verify (the root checks too), whatever changed
#   scripts/ship.sh --serial     run the packages' tests one at a time (when agents are loading the machine)
#   scripts/ship.sh --dry-run    everything except the deploy and the last-ship record; works off any branch
#                                (the main and origin guards and the secrets file become warnings)
#   scripts/ship.sh --since <sha>   treat <sha> as the last ship
#   scripts/ship.sh --launch --confirm-public [--remove-gate]
#                                the launch: deploy without the gate, then print (or, with --remove-gate, run) the
#                                commands that delete the gate's secrets from the Worker, and write apps/docs/LAUNCHED
#
# Public or gated: the committed file apps/docs/LAUNCHED says the site has launched. Without it every ship deploys with
# the gate (the secrets file below, passed to cf deploy); with it, or with --launch, no ship needs the secrets file or
# passes it, so a later ship never puts the gate back. The launch writes the file; commit and push it.
#
# Needs: a clean checkout of main, level with origin/main; `cf` logged in (cf auth login or CLOUDFLARE_API_TOKEN);
# before launch, apps/docs/.secrets.production.json (pnpm -F docs cf:secrets production).
#
# What it runs:
# 1. Guards: on main, clean tree, up to date with origin, production secrets file complete (gated ships only).
# 2. The affected set (scripts/affected.mjs): the packages the diff since the last ship touches plus everything that
#    depends on them. A docs-only change verifies docs only; a root config or lockfile change verifies everything.
#    Only those packages' verify runs (pnpm --filter), in parallel. Nothing site-related affected: no build, no deploy.
#    When a library is in the set, `pnpm smoke` then builds Next and Vite apps from its packed tarballs.
# 3. ONE production build: pnpm -F docs build:static --mode production --budgets (generate, next build, the page-weight
#    and JS budgets on that same build, the static export). It reuses apps/docs/.next/cache, so a warm build only
#    recompiles what changed; never delete that folder in the main checkout. The promo videos on R2 are
#    pnpm -F docs media:upload, on its own.
# 4. pnpm -F docs cf:release:production: the Worker and out/ as Build Output, cf deploy with the secrets
#    (so the version goes out with the gate), then a check that https://www.youj.dev answers. Public:
#    cf:release:production:public, the same without the secrets, after a check that out/robots.txt allows crawling.
#    The registry's older /r/v<version>/ folders are restored from R2 during the build (YOUJ_REGISTRY_ARCHIVE=r2,
#    apps/docs/scripts/registry-archive.ts); the ship fails when one is missing from public/r or out/r, and after
#    a deploy it archives the current version (once, never overwritten), but only when that version is published
#    on npm: an archive taken from a build that was never released would be frozen as the wrong merge base.
#    (A wrong copy is replaced on purpose with pnpm -F docs registry:archive -- --force, from the release commit.)
# 5. The hosted MCP (mcp.youj.dev) must serve the tools this checkout builds; ship fails when it is out of date.
#    The MCP Worker is deployed separately (pnpm -F @youj/mcp cf:deploy); ship also says when its inputs changed.
# The last shipped commit is kept in .ship/last-ship (not committed).
set -u
cd "${0:A:h}/.."
full=0 serial=0 dry=0 base_arg="" launch=0 confirm=0 remove_gate=0
while [ $# -gt 0 ]; do
  case $1 in
    --full) full=1 ;;
    --serial) serial=1 ;;
    --dry-run) dry=1 ;;
    --since) shift; base_arg=${1:-} ;;
    --launch) launch=1 ;;
    --confirm-public) confirm=1 ;;
    --remove-gate) remove_gate=1 ;;
    *) echo "unknown option $1"; exit 2 ;;
  esac
  shift
done

# The gate's secrets on the production Worker. STEALTH_PASSWORD is the switch, so it goes first.
GATE_SECRETS=(STEALTH_PASSWORD STEALTH_TOKEN STEALTH_SECRET LAUNCH_AT)
LAUNCHED=apps/docs/LAUNCHED
if [ $launch = 1 ] && [ $confirm = 0 ]; then
  echo "ship: --launch makes www.youj.dev public for everyone; run it again with --confirm-public to mean it"
  exit 2
fi
if [ $launch = 0 ] && { [ $confirm = 1 ] || [ $remove_gate = 1 ]; }; then echo "ship: --confirm-public and --remove-gate go with --launch"; exit 2; fi
public=$launch
[ -f $LAUNCHED ] && public=1

typeset -a timings
mark() { timings+=("$(printf '%5ss  %s' $((SECONDS - t0)) "$1")"); t0=$SECONDS; }
report() { echo "ship: timings"; printf '  %s\n' "${timings[@]}"; echo "  $(printf '%5ss' $SECONDS)  total"; }
t0=$SECONDS

if [ $dry = 1 ]; then
  echo "ship: DRY RUN (no deploy, last-ship untouched)"
  [ "$(git rev-parse --abbrev-ref HEAD)" = main ] || echo "ship: (dry run) not on main"
else
  [ "$(git rev-parse --abbrev-ref HEAD)" = main ] || { echo "ship: not on main"; exit 2; }
fi
[ -z "$(git status --porcelain)" ] || { echo "ship: the working tree is not clean; production is built from a clean main"; exit 2; }
git fetch --quiet origin main || { echo "ship: could not fetch origin"; exit 2; }
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
  # After the public snapshot (pnpm launch:snapshot) origin's history starts afresh; main has to move onto it once.
  git merge-base HEAD origin/main >/dev/null 2>&1 ||
    echo "ship: main and origin/main share no history: move main onto the public one (the steps pnpm launch:snapshot prints)"
  if [ $dry = 1 ]; then echo "ship: (dry run) HEAD is not level with origin/main"; else echo "ship: main is not level with origin/main (pull or push first)"; exit 2; fi
fi
if [ $public = 1 ]; then
  if [ $launch = 1 ]; then echo "ship: LAUNCH: production goes out without the stealth gate"
  else echo "ship: public ($LAUNCHED is committed): no gate"; fi
  # The gate's variables would turn app/robots.ts back to disallow-all in the build.
  unset STEALTH_PASSWORD STEALTH_TOKEN STEALTH_SECRET
elif [ $dry = 1 ]; then
  node apps/docs/scripts/cf-env-secrets.ts --check production || echo "ship: (dry run) the production secrets file is not complete"
else
  node apps/docs/scripts/cf-env-secrets.ts --check production || exit 2
fi
mark "guards"

head=$(git rev-parse HEAD)
base=${base_arg:-$(cat .ship/last-ship 2>/dev/null || cat .vercel/last-ship 2>/dev/null || true)}
git cat-file -e "$base^{commit}" 2>/dev/null || base=""
echo "ship: $(git log --oneline -1 | cut -c1-60)"

# The affected set. No usable last ship, or --full: everything.
all=1 pkgs="" mcp=0
if [ $full = 0 ] && [ -n "$base" ]; then
  aff=$(node scripts/affected.mjs --base "$base" --json) || { echo "ship: could not compute the affected set"; exit 1; }
  all=$(echo "$aff" | node -p 'JSON.parse(require("fs").readFileSync(0,"utf8")).all ? 1 : 0')
  pkgs=$(echo "$aff" | node -p 'JSON.parse(require("fs").readFileSync(0,"utf8")).packages.join(" ")')
  mcp=$(echo "$aff" | node -p 'JSON.parse(require("fs").readFileSync(0,"utf8")).mcp ? 1 : 0')
  echo "ship: since ${base:0:8}: $(git diff --name-only "$base" HEAD | grep -c .) files changed"
  if [ $all = 1 ]; then echo "ship: affected: everything (root config, lockfile or a root script changed)"
  else echo "ship: affected: ${pkgs:-nothing to verify}"; fi
else
  mcp=1
  if [ $full = 1 ]; then echo "ship: affected: everything (--full)"; else echo "ship: affected: everything (no last ship recorded)"; fi
fi

conc=4; [ $serial = 1 ] && conc=1
# Parallel packages share the cores: cap each vitest at half of them so four runs don't oversubscribe the machine
# (timing-sensitive tests then see a steady load).
if [ $conc -gt 1 ]; then export VITEST_MAX_WORKERS=$(( $(sysctl -n hw.ncpu 2>/dev/null || nproc) / 2 )); fi
if [ $all = 1 ]; then
  echo "ship: verify (all packages and the root checks)"
  npm_config_workspace_concurrency=$conc pnpm verify || { echo "ship: verify FAILED"; exit 1; }
elif [ -n "$pkgs" ]; then
  echo "ship: verify ($pkgs)"
  typeset -a filters
  for p in ${=pkgs}; do filters+=(--filter "$p"); done
  pnpm "${filters[@]}" --workspace-concurrency=$conc --if-present run verify || { echo "ship: verify FAILED"; exit 1; }
else
  echo "ship: no package changes, skipping tests"
fi
mark "verify"

# A library changed: build fresh Next and Vite apps from the packed tarballs, as a user would install them
# (an unexported subpath in a dist once broke every app that imported @youj/icons while verify stayed green).
if [ $all = 1 ] || [[ " $pkgs " == *" @youj/"* ]]; then
  echo "ship: smoke (consumer apps from the packed packages)"
  pnpm smoke || { echo "ship: smoke FAILED"; exit 1; }
  mark "smoke"
fi

# Deploy only when the site's inputs are in the affected set (docs depends on the packages it builds from).
# The launch always deploys: it's what takes the gate down.
if [ $launch = 0 ] && [ $all = 0 ] && [[ " $pkgs " != *" docs "* ]]; then
  echo "ship: nothing the site is built from changed; no build and no deploy"
  [ $dry = 1 ] || { mkdir -p .ship && echo "$head" > .ship/last-ship; }
  [ $mcp = 1 ] && echo "ship: MCP index inputs changed: run pnpm -F @youj/mcp cf:deploy"
  report
  exit 0
fi

echo "ship: one production build (generate, next build, budgets, export; youj -> www.youj.dev)"
export YOUJ_REGISTRY_ARCHIVE=${YOUJ_REGISTRY_ARCHIVE:-r2}
pnpm -F docs build:static --mode production --budgets || { echo "ship: build FAILED"; exit 1; }
# The version the last ship carried, when it differs from this one, must be in the archive too.
prev=""
[ -n "$base" ] && prev=$(git show "$base:packages/cli/package.json" 2>/dev/null | node -p 'JSON.parse(require("fs").readFileSync(0,"utf8")).version' 2>/dev/null)
[ "$prev" = "$(node -p 'require("./packages/cli/package.json").version')" ] && prev=""
(cd apps/docs && node scripts/registry-archive.ts verify ${prev:+--previous $prev}) || { echo "ship: an archived registry version is missing from the build; older CLIs would 404"; exit 1; }
if [ $public = 1 ]; then
  grep -qx 'Allow: /' apps/docs/out/robots.txt && grep -qx 'Sitemap: https://www.youj.dev/sitemap.xml' apps/docs/out/robots.txt ||
    { echo "ship: out/robots.txt doesn't allow crawling and name the sitemap; was the build made with STEALTH_PASSWORD set?"; cat apps/docs/out/robots.txt; exit 1; }
fi
mark "build:static (generate, next build, budgets, export)"

if [ $dry = 1 ]; then
  pnpm -F docs cf:build:production || { echo "ship: Build Output FAILED"; exit 1; }
  mark "cf:build:production"
  echo "ship: dry run done; not deployed (registry version not archived)"
  if [ $launch = 1 ]; then
    echo "ship: (dry run) the launch would now delete the gate's secrets from the Worker youj:"
    for name in $GATE_SECRETS; do echo "  (cd apps/docs && CF_SEND_TELEMETRY=false pnpm exec cf workers secrets delete $name --worker youj --mode production --force)"; done
    echo "ship: (dry run) and write $LAUNCHED for you to commit"
  fi
else
  if [ $public = 1 ]; then echo "ship: deploying production (public: no secrets file)"; else echo "ship: deploying production"; fi
  out=$(mktemp)
  if [ $public = 1 ]; then pnpm -F docs cf:release:production:public 2>&1 | tee "$out"
  else pnpm -F docs cf:release:production 2>&1 | tee "$out"; fi
  [ "${pipestatus[1]}" = 0 ] || { echo "ship: deploy FAILED"; exit 1; }
  echo "ship: deployed: $(grep -iE 'version' "$out" | head -3 | tr -s ' │' ' ' | tr '\n' ';')"
  mark "cf build output and deploy"
  cli_version=$(node -p 'require("./packages/cli/package.json").version')
  if npm view "youj@$cli_version" version >/dev/null 2>&1; then
    (cd apps/docs && node scripts/registry-archive.ts archive) || { echo "ship: deployed, but archiving this registry version FAILED: run pnpm -F docs registry:archive now, before the next version ships"; exit 1; }
  else
    echo "ship: youj@$cli_version is not published on npm; registry v$cli_version NOT archived (ship again after the release)"
  fi

  # A deploy keeps the Worker's secrets: until STEALTH_PASSWORD is deleted, the gate is still up.
  if [ $launch = 1 ]; then
    if [ $remove_gate = 1 ]; then
      echo "ship: deleting the gate's secrets from the Worker youj"
      gate_failed=0
      for name in $GATE_SECRETS; do
        (cd apps/docs && CF_SEND_TELEMETRY=false pnpm exec cf workers secrets delete $name --worker youj --mode production --force) ||
          { echo "ship: could not delete $name (already gone?)"; gate_failed=1; }
      done
      [ $gate_failed = 0 ] || echo "ship: check what's left: (cd apps/docs && CF_SEND_TELEMETRY=false pnpm exec cf workers secrets list --worker youj --mode production)"
    else
      echo "ship: deployed without the gate's secrets file; the gate stays up until you delete its secrets from the Worker:"
      for name in $GATE_SECRETS; do echo "  (cd apps/docs && CF_SEND_TELEMETRY=false pnpm exec cf workers secrets delete $name --worker youj --mode production --force)"; done
    fi
    [ -f $LAUNCHED ] || printf '%s\n%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      "The production site is public: scripts/ship.sh deploys it without the stealth gate (apps/docs/docs/hosting.md)." > $LAUNCHED
  fi

  # The gate answers www with a page or a redirect to /stealth; anything below 400 from Cloudflare is the Worker.
  code=000
  for i in 1 2 3 4 5 6; do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 https://www.youj.dev/)
    # Once the gate's secrets are deleted, only a 200 will do (the new version takes a moment to reach every colo).
    if [ $remove_gate = 1 ]; then [ $code = 200 ] && break; else case $code in 2??|3??) break ;; esac; fi
    sleep 10
  done
  case $code in
    2??|3??) echo "ship: https://www.youj.dev answers $code" ;;
    *) echo "ship: https://www.youj.dev answers $code; check the Worker's domain"; exit 1 ;;
  esac
  mkdir -p .ship && echo "$head" > .ship/last-ship && echo "ship: www.youj.dev now serves ${head:0:8}"
  mark "check www"
  if [ $launch = 1 ]; then
    if [ $code = 200 ]; then echo "ship: www.youj.dev is public; run pnpm launch:verify"
    else echo "ship: www.youj.dev answers $code, not 200: the gate is up until STEALTH_PASSWORD is deleted (above)"; fi
    git diff --quiet HEAD -- $LAUNCHED 2>/dev/null && git ls-files --error-unmatch $LAUNCHED >/dev/null 2>&1 ||
      echo "ship: commit the public state, so no later ship puts the gate back: git add $LAUNCHED && git commit -m 'Keep production public after the launch' && git push"
  fi
fi

# The hosted MCP serves its own copy of the index, deployed by hand; a stale one teaches the old API.
mcp_check() { (cd packages/mcp && pnpm generate >/dev/null && YOUJ_MCP_HOSTED=${YOUJ_MCP_URL:-https://mcp.youj.dev} npx vitest run test/hosted.test.ts); }
if mcp_check; then
  mark "hosted MCP is current"
elif [ $dry = 1 ]; then
  echo "ship: (dry run) the hosted MCP is out of date or unreachable: run pnpm -F @youj/mcp cf:deploy"
else
  echo "ship: the hosted MCP (mcp.youj.dev) is out of date or unreachable: run pnpm -F @youj/mcp cf:deploy"
  exit 1
fi

[ $mcp = 1 ] && echo "ship: MCP index inputs changed: run pnpm -F @youj/mcp cf:deploy"
report
exit 0
