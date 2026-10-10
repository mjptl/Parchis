// Parchis landing page interactions.
// One orchestrated hero moment (headline, marker, ribbon, bill → entry); brush marks draw in once as you reach them.

(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nav: border once scrolled, hide on scroll down, show on scroll up.
  const nav = document.querySelector('[data-nav]');
  let lastY = window.scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 8);
    const goingDown = y > lastY && y > 240;
    nav.classList.toggle('is-hidden', goingDown && !nav.contains(document.activeElement));
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  // Trial form: client-side validation and confirmation.
  // TODO: send the data to your backend or CRM before showing the confirmation.
  const form = document.querySelector('[data-form]');
  const error = form.querySelector('[data-error]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = [...form.querySelectorAll('input, select')];
    fields.forEach((f) => f.removeAttribute('aria-invalid'));
    const phone = form.elements.phone;
    const digits = phone.value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    const missing = fields.filter((f) => !f.value.trim());
    let message = '';
    if (missing.length) {
      missing.forEach((f) => f.setAttribute('aria-invalid', 'true'));
      message = 'Fill in your name, WhatsApp number and business type.';
      missing[0].focus();
    } else if (!/^[6-9]\d{9}$/.test(digits)) {
      phone.setAttribute('aria-invalid', 'true');
      message = 'Enter a 10-digit Indian mobile number, like 98765 43210.';
      phone.focus();
    }
    error.textContent = message;
    if (message) return;
    form.querySelector('.form__body').hidden = true;
    const done = form.querySelector('[data-done]');
    done.hidden = false;
    done.focus();
  });

  // Destination strip: roll through the software names and light the matching tile.
  const syncs = document.querySelector('[data-syncs]');
  if (syncs && !reduce) {
    const word = syncs.querySelector('[data-roll]');
    const tiles = [...syncs.querySelectorAll('.syncs__tiles li')];
    const names = tiles.map((t) => t.lastElementChild.textContent);
    let k = 0;
    setInterval(() => {
      if (document.hidden) return;
      k = (k + 1) % names.length;
      word.classList.remove('is-in');
      word.classList.add('is-out');
      setTimeout(() => {
        word.textContent = names[k];
        word.classList.remove('is-out');
        word.classList.add('is-in');
        tiles.forEach((t, n) => t.classList.toggle('is-on', n === k));
      }, 280);
    }, 2200);
  }

  // Business-type tabs: click or arrow keys switch the panel.
  const seg = document.querySelector('[data-seg]');
  if (seg) {
    const tabs = [...seg.querySelectorAll('[role="tab"]')];
    const select = (tab) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
    };
    tabs.forEach((t, n) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        const next = tabs[(n + step + tabs.length) % tabs.length];
        select(next);
        next.focus();
      });
    });
  }

  // Pricing calculator: pick the plan that fits the volume, add ₹3 per extra bill.
  const calc = document.querySelector('[data-calc]');
  if (calc) {
    const range = calc.querySelector('[data-range]');
    const out = (k) => calc.querySelector(`[data-out="${k}"]`);
    const plans = [
      { id: 'starter', name: 'Starter', price: 999, limit: 300 },
      { id: 'business', name: 'Business', price: 2499, limit: 1000 },
      { id: 'ca', name: 'CA firm', price: 4999, limit: 2500 },
    ];
    const inr = new Intl.NumberFormat('en-IN');
    const inr2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const update = () => {
      const bills = Number(range.value);
      const plan = plans.find((p) => bills <= p.limit) || plans[plans.length - 1];
      const total = plan.price + Math.max(0, bills - plan.limit) * 3;
      out('bills').textContent = inr.format(bills);
      out('plan').textContent = plan.name;
      out('price').textContent = '₹' + inr.format(total);
      out('per').textContent = '₹' + inr2.format(total / bills);
      // 3 to 5 minutes of typing per bill; use 4.
      out('hours').textContent = '≈ ' + inr.format(Math.round((bills * 4) / 60)) + ' hours';
      document.querySelectorAll('[data-plan]').forEach((el) => el.classList.toggle('is-fit', el.dataset.plan === plan.id));
    };
    range.addEventListener('input', update);
    update();
  }

  // Motion below needs GSAP and a visitor who hasn't asked for reduced motion.
  if (reduce || !window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);

  // Prepare a stroke so it can be drawn on.
  const drawable = (path) => {
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    return path;
  };

  // Split the headline into words for a staggered entrance; keep the full text for screen readers.
  const title = document.querySelector('[data-split]');
  const text = title.textContent.trim();
  title.setAttribute('aria-label', text);
  title.innerHTML = text.split(' ')
    .map((w) => `<span class="w" aria-hidden="true">${w}</span>`)
    .join(' ');

  const marker = drawable(document.querySelector('.marker path'));
  const ribbon = drawable(document.querySelector('.ribbon path'));
  const fields = gsap.utils.toArray('[data-demo="f"]');

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.hero__title .w', { yPercent: 40, opacity: 0, duration: 0.7, stagger: 0.06 })
    .to(marker, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, '-=0.2')
    .from(['.lede', '.hero__cta'], { y: 12, opacity: 0, duration: 0.5, stagger: 0.08 }, '-=0.3')
    .to(ribbon, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, '-=0.4')
    .from('[data-demo="slip"]', { x: -24, opacity: 0, duration: 0.7 }, '<0.2')
    .from('[data-demo="entry"]', { y: 16, opacity: 0, duration: 0.5 }, '<0.2')
    .from(fields, { opacity: 0, x: 8, duration: 0.3, stagger: 0.1 })
    .from('[data-demo="status"]', { scale: 0.8, opacity: 0, duration: 0.35, ease: 'back.out(2)' });

  // Brush marks paint in once when they come into view.
  const paint = (selector, trigger, opts = {}) => {
    const paths = gsap.utils.toArray(selector).map(drawable);
    if (!paths.length) return;
    gsap.to(paths, {
      strokeDashoffset: 0, duration: 0.6, ease: 'power2.out', stagger: 0.05, ...opts,
      scrollTrigger: { trigger, start: 'top 75%', once: true },
    });
  };
  paint('.burst__rays path', '.burst');
  paint('.duo .chevrons path', '.duo', { stagger: 0.08 });

  gsap.from('.leaves ellipse', {
    scale: 0, transformOrigin: '50% 50%', duration: 0.5, stagger: 0.04, ease: 'back.out(2)',
    scrollTrigger: { trigger: '.problem', start: 'top 75%', once: true },
  });

  // How it works: one bill travels the pipeline, changing shape at each stage. Desktop only.
  const pipe = document.querySelector('[data-pipe]');
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1040px)', () => {
    const $ = (s) => pipe.querySelector(s);
    const srcs = [...pipe.querySelectorAll('[data-src]')];
    const wires = [...pipe.querySelectorAll('.wire')];
    const doc = $('[data-pkt="doc"]'), data = $('[data-pkt="data"]'), entry = $('[data-pkt="entry"]');
    const docIcon = $('[data-pkt-icon]');
    const rdDoc = $('.rd__doc'), beam = $('.rd__beam');
    const hls = [...pipe.querySelectorAll('.hl')];
    const chips = [...pipe.querySelectorAll('.chips li')];
    const rvRows = [...pipe.querySelectorAll('.rv > div')];
    const pick = $('[data-pick]'), state = $('[data-state]');
    const batchRow = $('[data-batch]'), batchHl = $('.hl--warn'), batchChip = chips[chips.length - 1], batchText = $('.rd__row em');
    // Bills from these channels have one unclear field; the rest come through clean.
    const flagged = new Set(['i-gmail', 'i-telegram', 'i-paper']);
    const tally = $('[data-tally]'), count = $('[data-count]');
    let n = 35, i = 0, tl;

    // Travel from the out-port of one stage to the in-port of the next.
    const travel = (pkt, wire) => {
      const dist = () => wire.clientWidth - pkt.offsetWidth;
      return gsap.timeline()
        .fromTo(pkt, { x: 0, opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.25 })
        .to(pkt, { x: dist, duration: 0.9, ease: 'power1.inOut' })
        .to(pkt, { opacity: 0, scale: 0.6, duration: 0.2 });
    };

    const setFlag = (on) => {
      batchHl.classList.toggle('hl--warn', on);
      batchChip.className = on ? 'chip-warn' : 'chip-ok';
      batchText.style.filter = on ? '' : 'none';
      batchRow.classList.toggle('rv__flag', on);
      batchRow.classList.toggle('is-clean', !on);
    };

    const reset = () => {
      gsap.set([rdDoc, ...hls, ...chips, ...rvRows, state], { opacity: 0 });
      gsap.set(beam, { opacity: 0, y: 0 });
      pick.classList.remove('is-pick');
      state.innerHTML = '<span class="warn">1 field to confirm</span>';
      srcs.forEach((s) => s.classList.remove('is-live'));
    };

    const cycle = () => {
      const src = srcs[i % srcs.length];
      i += 1;
      const unclear = flagged.has(src.dataset.src);
      reset();
      setFlag(unclear);
      docIcon.setAttribute('href', '#' + src.dataset.src);
      tl = gsap.timeline({ onComplete: cycle, defaults: { ease: 'power2.out' } })
        // 1: a channel receives a bill and sends it on
        .call(() => src.classList.add('is-live'))
        .add(travel(doc, wires[0]), '+=0.5')
        // 2: the bill lands, is scanned, and each field is checked
        .fromTo(rdDoc, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.35 }, '-=0.15')
        .call(() => src.classList.remove('is-live'))
        .to(beam, { opacity: 1, duration: 0.1 })
        .to(beam, { y: () => rdDoc.clientHeight - 2, duration: 1.1, ease: 'none' })
        .to(beam, { opacity: 0, duration: 0.15 })
        .to(hls, { opacity: 1, duration: 0.2, stagger: 0.18 }, '-=0.9')
        .to(chips, { opacity: 1, duration: 0.2, stagger: 0.15 })
        // structured data, not the bill, moves on
        .add(travel(data, wires[1]), '+=0.3')
        // 3: fields appear; the one unclear field is confirmed
        .to(rvRows, { opacity: 1, duration: 0.2, stagger: 0.12 }, '-=0.15')
        .call(() => { if (!unclear) state.innerHTML = '<span class="ok">Nothing to review</span>'; })
        .to(state, { opacity: 1, duration: 0.2 })
        .call(() => { if (unclear) pick.classList.add('is-pick'); }, null, unclear ? '+=0.6' : '+=0')
        .call(() => { if (unclear) state.innerHTML = '<span class="ok">Confirmed</span>'; }, null, unclear ? '+=0.3' : '+=0')
        // 4: the entry lands in the books
        .add(travel(entry, wires[2]), '+=0.3')
        .call(() => { n += 1; count.textContent = n; tally.classList.add('is-flash'); })
        .call(() => tally.classList.remove('is-flash'), null, '+=0.6')
        .to({}, { duration: 1.2 });
    };

    ScrollTrigger.create({ trigger: pipe, start: 'top 80%', once: true, onEnter: cycle });

    return () => {
      if (tl) tl.kill();
      gsap.set([rdDoc, ...hls, ...chips, ...rvRows, state, beam, doc, data, entry], { clearProps: 'all' });
      setFlag(true);
      pick.classList.add('is-pick');
      state.innerHTML = '<span class="ok">Confirmed</span>';
      count.textContent = 36;
      srcs.forEach((s) => s.classList.remove('is-live'));
    };
  });

  // Scroll reveals: each section enters once, with motion suited to its content.
  const reveal = (targets, vars, trigger, start = 'top 82%') => {
    const els = gsap.utils.toArray(targets);
    if (!els.length) return;
    gsap.from(els, {
      opacity: 0, y: 28, duration: 0.7, ease: 'power3.out', stagger: 0.08, clearProps: 'transform,opacity', ...vars,
      scrollTrigger: { trigger: trigger || els[0], start, once: true },
    });
  };

  // Section headings and their intro lines, everywhere below the hero.
  gsap.utils.toArray('main > section:not(.hero)').forEach((sec) => {
    reveal(sec.querySelectorAll(':scope .h2, :scope .product__head .sub, :scope .wrap > .sub, :scope .faq__side .sub'), { y: 24, stagger: 0.1 }, sec);
  });

  // Problem: bills drop onto the pile one by one, then the two points.
  reveal('.bills .bill > *', { y: -40, rotate: () => gsap.utils.random(-6, 6), duration: 0.6, stagger: 0.07, ease: 'back.out(1.4)' }, '.bills');
  reveal('.points--stack .point', { x: -16, y: 0, stagger: 0.12 }, '.points--stack');

  // Product: the review screen rises, then its rows fill in.
  reveal('.app', { y: 60, scale: 0.97, duration: 0.9 }, '.app', 'top 85%');
  reveal('.queue li', { x: -14, y: 0, duration: 0.4, stagger: 0.05 }, '.app', 'top 60%');
  reveal('.fields dl > div, .ask, .fields__btn', { y: 10, duration: 0.4, stagger: 0.05 }, '.app', 'top 60%');
  reveal('.traits > div', { stagger: 0.12 }, '.traits');

  // Result: the card settles into the middle of the burst.
  reveal('.burst__card', { scale: 0.9, y: 20, duration: 0.8, ease: 'back.out(1.6)' }, '.burst');
  reveal('.burst__tab', { y: -16, duration: 0.5, delay: 0.3 }, '.burst');

  // How it works: the four stages light up left to right, then the two panels.
  reveal('.pipe .node', { y: 36, stagger: 0.12 }, '.pipe');
  reveal('.pipe .wire', { scaleX: 0, y: 0, transformOrigin: 'left center', duration: 0.5, stagger: 0.12, delay: 0.3 }, '.pipe');
  reveal('.duo .panel', { y: 50, stagger: 0.15 }, '.duo');
  reveal('.duo .clients, .duo .voucher', { y: 24, scale: 0.96, duration: 0.6, stagger: 0.15, delay: 0.25 }, '.duo');

  // Checks: cards cascade, each visual pops in just after its card.
  ScrollTrigger.batch('.ccard', {
    start: 'top 85%', once: true,
    onEnter: (batch) => {
      gsap.from(batch, { opacity: 0, y: 36, duration: 0.6, ease: 'power3.out', stagger: 0.1, clearProps: 'transform,opacity' });
      gsap.from(batch.map((c) => c.querySelector('.ccard__vis > *')), { opacity: 0, scale: 0.92, duration: 0.5, delay: 0.2, stagger: 0.1, ease: 'back.out(1.6)', clearProps: 'transform,opacity' });
    },
  });

  // Who: tabs slide in, then the open panel rises.
  reveal('.seg__tab', { x: -12, y: 0, duration: 0.4, stagger: 0.06 }, '.seg');
  reveal('.seg__panel:not([hidden])', { y: 40, duration: 0.8, delay: 0.15 }, '.seg');

  // Pricing: the calculator, then the plans in turn.
  reveal('.calc', { y: 36 }, '.calc');
  reveal('.calc__out > div', { y: 14, duration: 0.45, stagger: 0.07, delay: 0.2 }, '.calc');
  reveal('.plans .plan', { y: 40, stagger: 0.12 }, '.plans');

  // Trial: the offer comes from the left, the form from the right.
  reveal('.trial__copy > .sub, .trial__copy > .swap, .trial__copy > .swap__caps', { x: -30, y: 0, stagger: 0.1, delay: 0.1 }, '.trial');
  reveal('.swap__stack', { scale: 0.8, y: 0, duration: 0.6, stagger: 0.25, ease: 'back.out(1.8)', delay: 0.3 }, '.trial');
  reveal('.trial .form', { x: 40, y: 0, duration: 0.8 }, '.trial');

  // FAQ and footer.
  reveal('.faq__nudge', { y: 20, delay: 0.2 }, '.faq', 'top 92%');
  reveal('.faq details', { y: 18, duration: 0.45, stagger: 0.06 }, '.faq__list', 'top 92%');
  reveal('.footer__top > *, .footer__bottom', { y: 20, stagger: 0.1 }, '.footer', 'top bottom');

  // Light scroll-linked drift on the paper slip (scrub uses ease: 'none').
  gsap.to('[data-demo="slip"]', {
    y: -24, ease: 'none',
    scrollTrigger: { trigger: '.stage', start: 'top 70%', end: 'bottom top', scrub: true },
  });
})();
