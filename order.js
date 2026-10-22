/* ---------- Order form ----------
   Pick a product from the dropdown, set the quantity, and press "Add another product"
   for more. "Send order on WhatsApp" opens WhatsApp to the Oribut number with the whole
   order already written out. The dropdown is in order.html, so it shows even before this runs. */
(function () {
  const WHATSAPP_NUMBER = '250790666679'; // 0790 666 679

  function init() {
    const form = document.getElementById('shineOrderForm');
    if (!form) return;
    const linesBox = document.getElementById('orderLines');
    const summary = document.getElementById('orderSummary');
    const totalEl = document.getElementById('orderTotal');
    const errorBox = document.getElementById('orderError');
    const sentBox = document.getElementById('orderSent');
    const norm = t => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

    const firstRow = linesBox.querySelector('.order-line');
    const proto = firstRow.cloneNode(true);
    const names = [...proto.querySelectorAll('.order-prod option')].map(o => o.value).filter(Boolean);

    const rows = () => [...linesBox.querySelectorAll('.order-line')];
    const read = r => ({
      row: r,
      product: r.querySelector('.order-prod').value,
      qty: Math.max(0, parseInt(r.querySelector('.order-qty').value, 10) || 0)
    });

    function refresh() {
      const lines = rows().map(read);
      linesBox.querySelectorAll('.order-remove').forEach(b => { b.hidden = lines.length < 2; });
      summary.innerHTML = '';
      let units = 0, count = 0;
      lines.forEach(l => {
        if (!l.product || !l.qty) return;
        count++; units += l.qty;
        const li = document.createElement('li');
        li.append(Object.assign(document.createElement('strong'), { textContent: l.qty + ' · ' }), document.createTextNode(l.product));
        summary.appendChild(li);
      });
      if (!count) {
        const li = document.createElement('li');
        li.className = 'order-summary-empty';
        li.textContent = 'No products chosen yet.';
        summary.appendChild(li);
      }
      totalEl.textContent = count ? count + (count === 1 ? ' product' : ' products') + ', ' + units + (units === 1 ? ' item' : ' items') + ' in total' : '';
    }

    linesBox.addEventListener('input', refresh);
    linesBox.addEventListener('change', refresh);
    linesBox.addEventListener('click', e => {
      const rm = e.target.closest('.order-remove');
      if (rm) { rm.closest('.order-line').remove(); refresh(); }
    });
    document.getElementById('addLine').addEventListener('click', () => {
      const row = proto.cloneNode(true);
      row.querySelector('.order-prod').value = '';
      row.querySelector('.order-qty').value = 1;
      linesBox.appendChild(row);
      refresh();
      row.querySelector('.order-prod').focus();
    });

    /* Arriving from a product page (order.html?product=...): pre-select that product */
    const wanted = new URLSearchParams(location.search).get('product');
    if (wanted) {
      const w = norm(wanted);
      const hit = names.find(n => norm(n) === w) || names.find(n => norm(n).includes(w)) || names.find(n => w.includes(norm(n)));
      if (hit) firstRow.querySelector('.order-prod').value = hit;
      else document.getElementById('orderNote').value = 'Interested in: ' + wanted;
    }
    refresh();

    function showError(msg, field) {
      errorBox.textContent = msg; errorBox.hidden = false; sentBox.hidden = true;
      if (field) field.focus();
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      errorBox.hidden = true;
      const name = document.getElementById('orderName').value.trim();
      const phone = document.getElementById('orderPhone').value.trim();
      const area = document.getElementById('orderArea').value.trim();
      const note = document.getElementById('orderNote').value.trim();
      const lines = rows().map(read);
      const chosen = lines.filter(l => l.product && l.qty > 0);

      if (!name) return showError('Please enter your name.', document.getElementById('orderName'));
      if (phone.replace(/\D/g, '').length < 9) return showError('Please enter a phone number we can reach you on.', document.getElementById('orderPhone'));
      if (!chosen.length) {
        const empty = lines.find(l => !l.product) || lines[0];
        return showError('Select a product and enter a quantity of 1 or more.', empty.row.querySelector('.order-prod'));
      }

      const msg = ['Hello Oribut, I would like to place an order.', '', '*Name:* ' + name, '*Phone:* ' + phone];
      if (area) msg.push('*Delivery area:* ' + area);
      msg.push('', '*Order:*');
      chosen.forEach((l, i) => msg.push((i + 1) + '. ' + l.product + ': ' + l.qty));
      if (note) msg.push('', '*Note:* ' + note);

      const url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg.join('\n'));
      const w = window.open(url, '_blank');
      if (!w) window.location.href = url; // popup blocked: open in the same tab

      sentBox.innerHTML = 'WhatsApp is opening with your order. Press <strong>Send</strong> there to finish. ' +
        'If nothing opened, <a href="' + url + '" target="_blank" rel="noopener">tap here</a>.';
      sentBox.hidden = false;
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
