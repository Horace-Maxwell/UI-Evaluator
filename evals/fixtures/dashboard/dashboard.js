// Bay 4 monitor: the dosing switch. Readings ship with the page; there is no loading, empty or error view.
(function () {
  var sw = document.getElementById('dosing-switch');
  var status = document.getElementById('dosing-status');
  sw.addEventListener('click', function () {
    var on = sw.getAttribute('aria-checked') !== 'true';
    sw.setAttribute('aria-checked', String(on));
    status.textContent = on
      ? 'Nutrient dosing is automatic: pumps A and B top up to EC 1.8.'
      : 'Nutrient dosing is now manual: the pumps run only when you start them.';
  });
})();
