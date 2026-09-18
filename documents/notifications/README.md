# Notification PDFs

Each notification is published twice: as a page under `notices/` that sets the
text in HTML, and as the signed PDF here that the page links to. On
`notifications.html` the action opens the page; the PDF is downloaded from
there.

Already published:

| PDF | Page |
|---|---|
| `2026-08-13-revised-fee-structure-smpa.pdf` | `notices/revised-fee-structure-2026.html` |

The instruments below are listed on `notifications.html` as "Document to
follow". Each needs both a PDF here and a page under `notices/`; until then
the row shows no button rather than a broken link.

| Expected filename | Document |
|---|---|
| `2022-10-18-dpud-transfer-to-kda.pdf` | Transfer of DPUD to KDA — SO(G)/HTP/KDA/8-23/2022 |
| `2020-09-14-merger-town-planning-department.pdf` | Merger of the Department of Town Planning into SMPA — SO(G)/HTP/SBCA/7-63/2018 |
| `2020-02-18-establishment-of-smpa.pdf` | Establishment of the Sindh Master Plan Authority — SO(G)/HTP/SBCA/7-63/2018 |
| `2019-01-22-supreme-court-order-cp-815-k-2016.pdf` | Order of the Supreme Court of Pakistan — C.P 815-K/2016 |
| `2013-11-06-mpd-under-sbca.pdf` | Master Plan Department placed under SBCA — SO(L&C)HTP/SBCA/12-14/2013 |

To add a new notification: drop the PDF here, then add a row to the table in
`notifications.html` with its date, title, reference and `data-cat`
(`sindh`, `court`, `circular` or `office`).
