// Catalogue page: the seed list ships in the HTML, so it is on screen at the first paint and works without this
// script. The script filters the list and shows the empty state. The loading and error states (?state=loading,
// ?state=error) are set by the small script in the page head.
(function () {
  var form = document.getElementById('search');
  var query = document.getElementById('q');
  var kind = document.getElementById('kind');
  var list = document.getElementById('varieties');
  var items = Array.prototype.slice.call(list.querySelectorAll('.variety'));
  var count = document.getElementById('result-count');
  var empty = document.getElementById('empty');
  var emptyTitle = document.getElementById('empty-title');

  function applyFilter() {
    var term = query.value.trim();
    var needle = term.toLowerCase();
    var type = kind.value;
    var shown = 0;
    items.forEach(function (item) {
      var name = item.querySelector('h3').textContent.toLowerCase();
      var match = (!type || item.getAttribute('data-kind') === type) && (!needle || name.indexOf(needle) !== -1);
      item.hidden = !match;
      if (match) shown += 1;
    });
    list.hidden = shown === 0;
    empty.hidden = shown !== 0;
    if (shown === 0) emptyTitle.textContent = term ? 'No varieties match ‘' + term + '’' : 'No varieties of this type yet';
    count.textContent = shown === 1 ? '1 variety' : shown + ' varieties';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    applyFilter();
  });

  kind.addEventListener('change', applyFilter);

  document.getElementById('clear').addEventListener('click', function () {
    query.value = '';
    kind.value = '';
    applyFilter();
    query.focus();
  });

  document.getElementById('retry').addEventListener('click', function () {
    window.location.assign('index.html');
  });
})();
