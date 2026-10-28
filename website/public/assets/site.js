(() => {
  const select = document.querySelector('[data-language]');
  if (select) select.addEventListener('change', () => { window.location.assign(`/${select.value}/`); });
})();
