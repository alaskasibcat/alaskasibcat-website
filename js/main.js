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

  // Keep the page usable before the owner uploads the real photographs.
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

  // Published kittens and retired adult cats use separate owner-managed lists.
  var list = document.getElementById('kitten-list');
  var adultList = document.getElementById('adult-cat-list');
  if (!list) return;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }
  function showAnimals(items, destination) {
    if (!destination) return;
    (items || []).filter(function (animal) { return animal.published === true; }).forEach(function (animal) {
      var card = el('article', 'kitten-card');
      if (animal.photo) {
        var img = el('img');
        img.alt = animal.photoAlt || animal.name;
        img.loading = 'lazy';
        img.addEventListener('error', function () { img.hidden = true; });
        img.src = animal.photo;
        card.appendChild(img);
      }
      var body = el('div', 'body');
      body.appendChild(el('span', 'status', animal.status || 'Available'));
      body.appendChild(el('h3', '', animal.name));
      [animal.sex, animal.color, animal.born ? 'Born ' + animal.born : '', animal.ready ? 'Ready to go home: ' + animal.ready : '', animal.price ? 'Price: ' + animal.price : '', animal.about].forEach(function (text) {
        if (text) body.appendChild(el('p', '', text));
      });
      var link = el('a', 'btn btn-quiet', 'Ask about ' + animal.name);
      link.href = '/contact?kitten=' + encodeURIComponent(animal.name);
      body.appendChild(link);
      card.appendChild(body);
      destination.appendChild(card);
    });
  }
  showAnimals(window.KITTENS, list);
  showAnimals(window.AVAILABLE_ADULTS, adultList);
})();
