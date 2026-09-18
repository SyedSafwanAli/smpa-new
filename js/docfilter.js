/* ==========================================================================
   SMPA — document category filter
   --------------------------------------------------------------------------
   Filters a document table by the chosen category. The table is complete in
   the markup, so with JavaScript off every document is still listed and every
   PDF still reachable — the filter only ever hides rows.
   ========================================================================== */
(function () {
  'use strict';

  function apply(root) {
    var chosen = root.querySelector('[data-doc-filter]:checked');
    var cat = chosen ? chosen.value : 'all';
    var table = document.getElementById(root.getAttribute('data-controls'));
    if (!table) { return; }

    var rows = table.querySelectorAll('tbody tr[data-cat]');
    var shown = 0;
    for (var i = 0; i < rows.length; i++) {
      var match = cat === 'all' || rows[i].getAttribute('data-cat') === cat;
      rows[i].hidden = !match;
      if (match) { shown++; }
    }

    /* The "nothing here" row is part of the table, shown only when a category
       has no documents yet. */
    var none = table.querySelector('.doc-table__none');
    if (none) { none.hidden = shown > 0; }

    /* Only the number is written here. The words around it stay in the markup
       so the language switch can translate them like any other string. */
    var count = document.getElementById(root.getAttribute('data-count'));
    if (count) { count.textContent = shown; }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var groups = document.querySelectorAll('[data-controls]');
    for (var i = 0; i < groups.length; i++) {
      (function (root) {
        root.addEventListener('change', function (e) {
          if (e.target && e.target.hasAttribute('data-doc-filter')) { apply(root); }
        });
        apply(root);
      })(groups[i]);
    }
  });
})();
