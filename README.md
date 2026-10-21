# LivingWM website

Website of **Living World Models: Predictive Vision for Biology and Medicine**, a half-day workshop proposed to CVPR 2027.
Live at <https://boom5426.github.io/livingwm/> (GitHub Pages, branch `main`, root folder).

A static site: one HTML page, one stylesheet and one small script, with no build step. `.nojekyll` stops GitHub Pages from running Jekyll.

## Layout

| Path | Content |
| --- | --- |
| `index.html` | All page content |
| `assets/css/style.css` | Styles; color tokens for light and dark mode are at the top |
| `assets/js/cells.js` | Decorative hero animation (drifting, dividing cells). Pauses off-screen and shows a still frame under reduced motion |
| `assets/img/figure1.svg` | Figure 1, converted from the proposal's vector PDF |
| `assets/img/og.png` | Link preview image (1200 x 630), rendered from `tools/og.html` |
| `assets/img/people/` | Organizer headshots (WebP, at most 400 px). Li, Cui and Yang: from their homepages. The other seven: from the Scientific World Models workshop site, which the same organizers maintain. Source URLs and crops are in `tools/build_assets.py` |
| `assets/fonts/` | Bricolage Grotesque (headings), Inter (text), Fraunces italic (math and quotes); woff2 from `@fontsource` 5.3.0, SIL Open Font License 1.1 |
| `tools/build_assets.py` | Regenerates the figure, the headshots and the preview image |

## Editing

Edit `index.html` and preview locally:

```bash
python3 -m http.server 8000   # then open http://localhost:8000/
```

Until the CVPR decision (22 December 2026), the proposal (`main.tex` in the private proposal repo) is the source of truth.
Text on this site is copied from it, so change both together. After the decision, this site is the source of truth for dates, speakers and the program.

Rules that apply at every stage:

- List only speakers who have confirmed, and mark each as tentative or confirmed.
- Never post Zoom links. CVPR allows them only on its virtual site.
- Keep the "Workshop proposal" badge and note in the hero until CVPR accepts the workshop.
- Update "Last updated" in the footer with each content change.

## Regenerating assets

Needs `pdftocairo` (poppler), Pillow and Google Chrome:

```bash
python3 tools/build_assets.py \
  --figure-pdf /path/to/proposal/figures/Figure1_living_world_models.pdf \
  --chrome google-chrome
```

## After acceptance (v1, by mid-January 2027)

1. Remove the proposal badge and note. Add the CVPR 2027 workshop line.
2. Add the OpenReview link and full submission instructions to the Call for Papers.
3. Replace "proposed" dates with final dates.
4. Add confirmed speakers (photo, affiliation, status) and the program committee.
