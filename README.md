# radioindex.org-news

The newsroom at **https://news.radioindex.org**: news, features and research from
radioindex.org, laid out like a corporate newsroom (lead story, section pages,
story pages with a dek, byline, key takeaways and related stories).

Every story comes from [radioindex.org-blog](https://github.com/thearchiveofamericanradio/radioindex.org-blog).
Nothing is written here.

## How it publishes

- `.github/workflows/publish.yml` checks out this repo and the blog, runs
  `npm run build` (writes `dist/`) and `npm test` (checks every page), then
  uploads `dist/` to the Cloudflare Pages project `radioindex-news`.
- Static files only: no Pages Functions, so it uses no Workers requests.
- Push to `main`: production. Pull request: preview at `pr-<n>.radioindex-news.pages.dev`.
- Every 15 minutes the job compares the blog's HEAD with `/build.json` on the
  live site and publishes only when the blog has changed.
- `scripts/attach-domain.sh` adds `news.radioindex.org` to the project and creates
  its proxied CNAME if it is missing. It never edits a record it did not create.

## Local build

```sh
git clone https://github.com/thearchiveofamericanradio/radioindex.org-blog blog
npm ci && npm run build && npm test
python3 -m http.server -d dist 8080
```

## Sections

`scripts/categories.mjs` maps blog posts to Features, Research, Calendar walks
and Recoveries by slug. Headlines, deks and key takeaways are derived from each
post in `scripts/load-posts.mjs`. Hero art is generated per story (`scripts/art.mjs`).
