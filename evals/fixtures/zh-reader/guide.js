// 导览首页：按展品编号查找。
(function () {
  var searchInput = document.getElementById('exhibit-number');
  var form = document.getElementById('search');
  var status = document.getElementById('search-status');

  function go() {
    var n = searchInput.value.trim();
    if (n === '12') {
      window.location.assign('exhibit-12.html');
      return;
    }
    status.textContent = n ? '没有找到编号为 ' + n + ' 的展品，请核对展柜标签上的编号。' : '请先输入展品编号。';
  }

  searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      go();
    }
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    go();
  });
})();
