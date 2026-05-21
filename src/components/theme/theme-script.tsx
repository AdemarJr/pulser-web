/** Evita flash de tema errado antes do React hidratar. */
export function ThemeScript() {
  const script = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var dark =
      stored === 'dark' ||
      (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  } catch (e) {}
})();
`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
