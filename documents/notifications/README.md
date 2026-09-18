# Notification PDFs

Every row on `notifications.html` leads to a real document. A notification is
published one of two ways:

- **Set in HTML** — a page under `notices/` carrying the text, with the PDF
  offered for download from that page. The row's action reads *View*.
- **PDF only** — the row's action opens the PDF in a new tab. Use this when
  the document does not need to be typed out.

| Date | PDF | Page |
|---|---|---|
| 13-08-2026 | `2026-08-13-revised-fee-structure-smpa.pdf` | `notices/revised-fee-structure-2026.html` |
| 18-02-2020 | `2020-02-18-establishment-of-smpa.pdf` | — opens the PDF |
| 06-11-2013 | `2013-11-06-mpd-under-sbca.pdf` | — opens the PDF |

## Adding one

1. Put the PDF here, named `YYYY-MM-DD-short-title.pdf`.
2. Add a row to the table in `notifications.html` with its date, title,
   reference and `data-cat` (`sindh`, `circular` or `office`).
3. Point the action at the PDF, or at a new page under `notices/` if the text
   is to be set in HTML as well.
4. Update the number in `<b id="notifCount">`.
