# Notification PDFs

The Download button on `notifications.html` links to this folder. A button
starts working the moment a file with the matching name is placed here —
no code change needed.

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
