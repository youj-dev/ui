// @vitest-environment node
import { DEFAULT_REPO_URL, REPO_URL, repo, repoBranch, repoUrl, resolveRepoHref, resolveRepoLinks, retargetRepo } from './repo'

describe('repoUrl', () => {
  it('defaults to the project repository', () => {
    expect(repoUrl({})).toBe(DEFAULT_REPO_URL)
    expect(repoUrl({ NEXT_PUBLIC_YOUJ_REPO_URL: '  ' })).toBe(DEFAULT_REPO_URL)
  })

  it('takes the env value, trailing slashes trimmed', () => {
    expect(repoUrl({ NEXT_PUBLIC_YOUJ_REPO_URL: 'https://github.com/acme/kit/ ' })).toBe('https://github.com/acme/kit')
    expect(repoUrl({ NEXT_PUBLIC_YOUJ_REPO_URL: 'https://gitlab.example.com/a/b//' })).toBe('https://gitlab.example.com/a/b')
  })

  it('rejects anything but an https repository URL', () => {
    for (const bad of ['http://github.com/acme/kit', 'github.com/acme/kit', 'https://github.com', 'https://github.com/acme/kit?x=1', 'not a url']) {
      expect(() => repoUrl({ NEXT_PUBLIC_YOUJ_REPO_URL: bad }), bad).toThrow(/NEXT_PUBLIC_YOUJ_REPO_URL/)
    }
  })
})

describe('repoBranch', () => {
  it('defaults to main and takes the env value', () => {
    expect(repoBranch({})).toBe('main')
    expect(repoBranch({ NEXT_PUBLIC_YOUJ_REPO_BRANCH: 'release/1.x' })).toBe('release/1.x')
    expect(() => repoBranch({ NEXT_PUBLIC_YOUJ_REPO_BRANCH: 'a b' })).toThrow(/NEXT_PUBLIC_YOUJ_REPO_BRANCH/)
  })
})

describe('repo links', () => {
  it('derives every link from the one URL', () => {
    expect(repo.issues).toBe(`${REPO_URL}/issues`)
    expect(repo.newAdvisory).toBe(`${REPO_URL}/security/advisories/new`)
    expect(repo.file('./LICENSE')).toBe(`${REPO_URL}/blob/main/LICENSE`)
  })

  it('resolves repo: hrefs and leaves others alone', () => {
    expect(resolveRepoHref('repo:')).toBe(REPO_URL)
    expect(resolveRepoHref('repo:issues/new')).toBe(`${REPO_URL}/issues/new`)
    expect(resolveRepoHref('repo:file/CONTRIBUTING.md#improving-a-language')).toBe(`${REPO_URL}/blob/main/CONTRIBUTING.md#improving-a-language`)
    expect(resolveRepoHref('/docs/installation')).toBe('/docs/installation')
    expect(resolveRepoLinks('[a](repo:discussions) and [b](/docs)')).toBe(`[a](${REPO_URL}/discussions) and [b](/docs)`)
  })

  it('leaves text alone while the repository is the default', () => {
    const text = `[Report](${DEFAULT_REPO_URL}/security/advisories/new) on \`youj-dev/ui\``
    expect(retargetRepo(text, DEFAULT_REPO_URL)).toBe(text)
  })

  it('points text written against the default repository at a moved one', () => {
    const text = `[Report](${DEFAULT_REPO_URL}/security/advisories/new) on \`youj-dev/ui\``
    expect(retargetRepo(text, 'https://github.com/acme/kit')).toBe('[Report](https://github.com/acme/kit/security/advisories/new) on `acme/kit`')
  })
})
