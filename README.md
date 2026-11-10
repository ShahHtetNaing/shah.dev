# shah.dev — Shah Htet Naing

Personal portfolio of **Shah Htet Naing** — IT Network Analyst, cybersecurity practitioner, Ph.D. researcher and creator of [SHAHHUB](https://shahhubtools.base44.app/).

The design combines the original diamond portfolio with a terminal / editorial "SHAH.OS" aesthetic.

## Features
- Boot-sequence loading screen (full on first visit, short on repeat visits, skippable with any key)
- Light / dark theme (remembers your choice, follows OS by default) + 5 accent colours
- Built-in terminal (`/` to open, `t` toggles theme) with `help`, `whoami`, `projects`, `theme`, `accent` …
- `git log` style experience timeline, filterable projects, searchable certificate wall with lightbox
- Recommendation letter viewer, volunteering timeline, travel log, case-study and article pages
- Responsive, keyboard accessible, respects `prefers-reduced-motion`; images optimised to WebP

## Structure
```
index.html            home: half-body hero + side menu
about.html            about + hanging ID card (drag to swing)
resume.html           experience, education, skills
portfolio.html        certificates & awards
projects.html         projects & SHAHHUB
blog.html             articles
contact.html          contact
work*.html            project case studies
post*.html            blog articles
assets/css/main.css   design system (themes, components, layout)
assets/js/main.js     loader, theme, terminal, filters, lightbox …
img/                  optimised WebP images
```

## Run locally
No build step — it's plain HTML/CSS/JS:
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
Deploy by uploading the folder to any static host (AWS S3 + CloudFront, GitHub Pages, Netlify …).
