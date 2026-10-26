(function () {
  // Mobile menu
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    function closeNavigation(restoreFocus) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      if (restoreFocus) toggle.focus();
    }
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        closeNavigation(false);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        closeNavigation(true);
      }
    });
    function closeWhenOutside(e) {
      if (nav.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
        closeNavigation(nav.contains(document.activeElement));
      }
    }
    document.addEventListener('click', closeWhenOutside);
    document.addEventListener('focusin', closeWhenOutside);
    window.matchMedia('(max-width:48rem)').addEventListener('change', function (e) {
      closeNavigation(e.matches && nav.contains(document.activeElement));
    });
  }

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Keep the page usable before Natalia uploads the real photographs.
  document.querySelectorAll('.cat-block .gallery').forEach(function (gallery) {
    var images = Array.from(gallery.querySelectorAll('img'));
    var notice = document.createElement('p');
    notice.className = 'gallery-empty';
    notice.textContent = 'Photos will be added soon.';
    notice.hidden = false;
    gallery.appendChild(notice);
    function refresh() {
      var visiblePhoto = images.some(function (img) { return img.complete && img.naturalWidth > 0; });
      notice.hidden = visiblePhoto;
    }
    images.forEach(function (img) {
      // Hidden lazy images would never load after the owner adds them.
      img.loading = 'eager';
      img.closest('figure').hidden = !(img.complete && img.naturalWidth > 0);
      function settled() {
        img.closest('figure').hidden = !img.naturalWidth;
        refresh();
      }
      img.addEventListener('load', settled);
      img.addEventListener('error', settled);
      if (img.complete) settled();
    });
    refresh();
  });

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
    [k.sex, k.color, k.born ? 'Born ' + k.born : '', k.ready ? 'Ready to go home: ' + k.ready : '', k.price ? 'Price: ' + k.price : '', k.about].forEach(function (t) {
      if (t) body.appendChild(el('p', '', t));
    });
    var a = el('a', 'btn btn-quiet', 'Ask about ' + k.name);
    a.href = '/contact?kitten=' + encodeURIComponent(k.name);
    body.appendChild(a);
    card.appendChild(body);
    list.appendChild(card);
  });
})();
