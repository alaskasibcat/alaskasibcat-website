(function () {
  // Mobile menu
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Kittens come from data/kittens.js, so Natalia edits data, not pages.
  var list = document.getElementById('kitten-list');
  var empty = document.getElementById('kitten-empty');
  if (!list || !empty) return;
  var kittens = (window.KITTENS || []).filter(function (k) { return k.published === true; });
  if (!kittens.length) { empty.hidden = false; return; }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }
  kittens.forEach(function (k) {
    var card = el('article', 'kitten-card');
    if (k.photo) {
      var img = el('img');
      img.src = k.photo; img.alt = k.photoAlt || k.name; img.loading = 'lazy';
      card.appendChild(img);
    }
    var body = el('div', 'body');
    body.appendChild(el('span', 'status', k.status || 'Available'));
    body.appendChild(el('h3', '', k.name));
    [k.sex, k.color, k.born ? 'Born ' + k.born : '', k.price ? 'Price: ' + k.price : '', k.about].forEach(function (t) {
      if (t) body.appendChild(el('p', '', t));
    });
    var a = el('a', 'btn btn-quiet', 'Ask about ' + k.name);
    a.href = '#contact';
    body.appendChild(a);
    card.appendChild(body);
    list.appendChild(card);
  });
})();
