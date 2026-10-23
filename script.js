'use strict';

const products = {
  'flat-white': { name: 'Flat white', price: 2.80 },
  croissant: { name: 'Croissant de mantequilla', price: 2.20 },
  'iced-latte': { name: 'Iced latte', price: 3.40 },
  tarta: { name: 'Tarta del día', price: 4.20 },
  tostada: { name: 'Tostada de temporada', price: 5.50 },
  sandwich: { name: 'Mini sándwich', price: 4.80 }
};

// DEMO: sustituye por el WhatsApp real con prefijo internacional, sin + ni espacios.
const WHATSAPP_NUMBER = '34600000000';
const cart = new Map();
const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const cartCount = document.getElementById('cart-count');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const cartFooter = document.getElementById('cart-footer');
const drawer = document.getElementById('cart-drawer');
const backdrop = document.getElementById('cart-backdrop');
const toast = document.getElementById('toast');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2300);
}

function addToCart(id) {
  if (!products[id]) return;
  cart.set(id, (cart.get(id) || 0) + 1);
  renderCart();
  showToast(products[id].name + ' añadido al pedido');
}

function changeQuantity(id, delta) {
  const next = (cart.get(id) || 0) + delta;
  if (next <= 0) cart.delete(id);
  else cart.set(id, next);
  renderCart();
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function renderCart() {
  const quantity = [...cart.values()].reduce((sum, value) => sum + value, 0);
  const total = [...cart.entries()].reduce((sum, [id, count]) => sum + products[id].price * count, 0);
  cartCount.textContent = String(quantity);
  cartTotal.textContent = euro.format(total);
  cartFooter.hidden = cart.size === 0;

  if (cart.size === 0) {
    cartItems.innerHTML = '<div class="empty-cart"><span>☕</span><h3>Tu carrito está descansando.</h3><p>Añade algo rico de la carta y lo preparamos.</p><button class="button button-dark" id="back-to-menu" type="button">Ver la carta</button></div>';
    document.getElementById('back-to-menu').addEventListener('click', () => {
      closeCart();
      document.getElementById('carta').scrollIntoView({ behavior: 'smooth' });
    });
    return;
  }

  cartItems.innerHTML = [...cart.entries()].map(([id, count]) => {
    const product = products[id];
    return '<article class="cart-line"><div><h3>' + escapeHtml(product.name) +
      '</h3><small>' + euro.format(product.price) +
      ' por unidad</small><div class="quantity-control"><button type="button" data-change="-1" data-id="' + id +
      '" aria-label="Quitar una unidad">−</button><span>' + count +
      '</span><button type="button" data-change="1" data-id="' + id +
      '" aria-label="Añadir una unidad">+</button></div></div><strong class="cart-line-price">' +
      euro.format(product.price * count) + '</strong></article>';
  }).join('');

  cartItems.querySelectorAll('[data-change]').forEach(button => {
    button.addEventListener('click', () => changeQuantity(button.dataset.id, Number(button.dataset.change)));
  });
}

function openCart() {
  backdrop.hidden = false;
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
  document.getElementById('close-cart').focus();
}

function closeCart() {
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  backdrop.hidden = true;
  document.body.classList.remove('no-scroll');
  document.getElementById('open-cart').focus();
}

document.querySelectorAll('[data-add]').forEach(button =>
  button.addEventListener('click', () => addToCart(button.dataset.add))
);
document.getElementById('open-cart').addEventListener('click', openCart);
document.getElementById('close-cart').addEventListener('click', closeCart);
backdrop.addEventListener('click', closeCart);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && drawer.classList.contains('is-open')) closeCart();
});

document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(tab => {
      const active = tab === button;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-pressed', String(active));
    });
    let visible = 0;
    document.querySelectorAll('.product-card').forEach(card => {
      const show = filter === 'todos' || card.dataset.category === filter;
      card.hidden = !show;
      if (show) visible++;
    });
    document.getElementById('menu-count').textContent =
      visible + (visible === 1 ? ' cosa rica' : ' cosas ricas');
  });
});

const mobileToggle = document.getElementById('mobile-menu-toggle');
const mobileNav = document.getElementById('mobile-nav');
mobileToggle.addEventListener('click', () => {
  const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
  mobileToggle.setAttribute('aria-expanded', String(!expanded));
  mobileToggle.setAttribute('aria-label', expanded ? 'Abrir menú' : 'Cerrar menú');
  mobileNav.hidden = expanded;
  mobileToggle.textContent = expanded ? '☰' : '×';
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mobileNav.hidden = true;
  mobileToggle.setAttribute('aria-expanded', 'false');
  mobileToggle.setAttribute('aria-label', 'Abrir menú');
  mobileToggle.textContent = '☰';
}));

document.getElementById('whatsapp-order').addEventListener('click', () => {
  if (cart.size === 0) return;
  const lines = [...cart.entries()].map(([id, count]) =>
    '• ' + count + ' x ' + products[id].name + ' — ' + euro.format(products[id].price * count)
  );
  const total = [...cart.entries()].reduce((sum, [id, count]) => sum + products[id].price * count, 0);
  const message = '¡Hola, Café Nómada! Me gustaría consultar este pedido de ejemplo:\n\n' +
    lines.join('\n') + '\n\nTotal estimado: ' + euro.format(total) +
    '\n\n¿Podéis confirmarme disponibilidad?';
  if (!/^\d{8,15}$/.test(WHATSAPP_NUMBER) || WHATSAPP_NUMBER === '34600000000') {
    showToast('Demo: cambia el número de WhatsApp en script.js para activar el enlace.');
    return;
  }
  window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
});

document.getElementById('year').textContent = String(new Date().getFullYear());
renderCart();
