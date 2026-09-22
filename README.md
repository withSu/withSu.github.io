# Bumsu Kim — Research homepage

Academic website for https://withsu.github.io.

## Structure

- `/`: About, biography, research summary, and news
- `/research/`: Research Interests with a scroll-driven 3D learning flywheel
- `/publications/`: Publications and individual paper pages
- `/cv/`: CV, education, research experience, and linked project pages
- `/papers/`: redirect for the original publications URL
- `/notes/`: reading notes and individual articles
- `/assets/Bumsu-Kim-CV.pdf`: CV generated from the same profile data

The four main tabs follow a restrained academic layout inspired by [766o.github.io](https://766o.github.io/), using a charcoal background by default. A light theme is available. Search opens with the search icon or Cmd/Ctrl+K and includes pages, projects, publications, and notes. The research flywheel tilts and rotates with scroll; reduced-motion preferences disable scroll animation.

## Local development

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open the local address printed by the server. Source and content changes rebuild the site; reload the page to see them.

## Updating the website

1. Edit `content/profile.json` for education, experience, contact information, and research interests.
2. Add project descriptions as Markdown files in `content/projects/`.
3. Copy `content/drafts/paper-template.md` to `content/papers/your-paper-slug.md` for a paper. Fill in the details and set `draft: false`.
4. Copy `content/drafts/note-template.md` to `content/notes/your-note-slug.md` for a note. Fill in the details and set `draft: false`.
5. Run `npm run build` and `npm run check`, then commit both the source and generated website files.

Only non-draft files from `content/papers/`, `content/projects/`, and `content/notes/` appear on the site. Draft files committed to this public repository remain visible in the repository.

Generated HTML, CSS, JavaScript, and the PDF are checked into the repository so the existing GitHub Pages branch deployment can serve them directly. `.nojekyll` bypasses the old Jekyll theme. This site does not require a server, API key, or third-party runtime service.

## Content provenance

- Name, lab affiliation, research areas, public email, and portrait: [IMC Lab members](https://imc.hanyang.ac.kr/composition/).
- Official lab name and department: [IMC Lab](https://imc.hanyang.ac.kr/).
- Education and research experience dates, CBNU research topic, and absence of public paper links: supplied by Bumsu Kim on September 22, 2026.
- Associative-memory project summary: [the public project repository](https://github.com/withSu/Long-term-Memory-Chatbot-with-Associative-Recall).
- Research statements are a website draft based on these interests; no benchmark results, publications, awards, or unconfirmed degree details are claimed.

The previous blog is retained in Git history.

## Third-party assets

Roboto is self-hosted under the SIL Open Font License; Lucide icons use the ISC license; Three.js uses the MIT license. Copies are in `licenses/`.
