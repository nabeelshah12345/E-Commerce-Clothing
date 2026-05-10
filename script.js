let cart = loadCart();
let currentProduct = null;
let currentQty = 1;

function loadCart() {
    try {
        const savedCart = JSON.parse(localStorage.getItem('bairanCart'));
        return Array.isArray(savedCart) ? savedCart : [];
    } catch (error) {
        return [];
    }
}

function saveCart() {
    localStorage.setItem('bairanCart', JSON.stringify(cart));
}

// Helper to parse price string to integer (e.g., "Rs. 2,299" -> 2299)
function parsePrice(str) {
    if (!str) return 0;
    const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
}

// Real-time product search filter
function setupProductSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', function () {
        filterProducts(this.value.toLowerCase().trim());
    });
}

// Filter products by query
function filterProducts(query) {
    const cards = document.querySelectorAll('.Products .card');
    cards.forEach(card => {
        const nameEl = card.querySelector('.firstinfo');
        if (!nameEl) return;
        const name = nameEl.textContent.toLowerCase();
        const matches = query === '' || name.includes(query);
        card.style.display = matches ? 'block' : 'none';
    });

    // Show/hide "Load More" button based on filtered results
    const loadMoreBtn = document.getElementById('load');
    if (loadMoreBtn) {
        const visibleCards = Array.from(cards).filter(card => card.style.display !== 'none');
        loadMoreBtn.style.display = visibleCards.length > 8 ? 'block' : 'none';
    }
}

// Perform search from button click
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        filterProducts(searchInput.value.toLowerCase().trim());
    }
}

// Update cart badge count
function updateCartCount() {
    const total = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
    const badge = document.getElementById('cartCount');
    if (badge) {
        badge.textContent = total;
        badge.style.display = total > 0 ? 'flex' : 'none';
    }
}

// Open product modal
function openModal(btn) {
    const card = btn.closest('.card');
    if (!card) return;

    const imgEl = card.querySelector('.photos img');
    const nameEl = card.querySelector('.firstinfo');
    const modalImg = document.getElementById('modalImg');
    const modalName = document.getElementById('modalName');
    const modalPrice = document.getElementById('modalPrice');
    const qtyDisplay = document.getElementById('qtyDisplay');
    const productModal = document.getElementById('productModal');

    if (!imgEl || !nameEl || !modalImg || !modalName || !modalPrice || !qtyDisplay || !productModal) return;

    const img = imgEl.src;
    const name = nameEl.textContent.trim();

    // Extract price text robustly from .secondinfo
    const secondInfo = card.querySelector('.secondinfo');
    let priceText = '';
    if (secondInfo) {
        // Find first non-empty text node
        for (let node of secondInfo.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                const txt = node.textContent.trim();
                if (txt) {
                    priceText = txt;
                    break;
                }
            }
        }
        // Fallback: take first part of textContent
        if (!priceText) {
            const match = secondInfo.textContent.match(/Rs\.\s*[\d,]+/i);
            priceText = match ? match[0] : secondInfo.textContent.trim();
        }
    }

    const priceValue = parsePrice(priceText);
    currentProduct = { img, name, price: priceText, priceValue };
    currentQty = 1;

    modalImg.src = img;
    modalName.textContent = name;
    modalPrice.textContent = priceText;
    qtyDisplay.textContent = currentQty;
    productModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Close modal (button)
function closeModalBtn() {
    const productModal = document.getElementById('productModal');
    if (productModal) {
        productModal.style.display = 'none';
    }
    document.body.style.overflow = '';
}

// Close modal when clicking overlay background
function closeModal(e) {
    if (e.target.id === 'productModal') closeModalBtn();
}

// Change quantity in modal
function changeQty(delta) {
    currentQty = Math.max(1, currentQty + delta);
    const qtyDisplay = document.getElementById('qtyDisplay');
    if (qtyDisplay) {
        qtyDisplay.textContent = currentQty;
    }
}

// Add current product to cart
function addToCart() {
    if (!currentProduct) return;

    const existing = cart.find(item => item.name === currentProduct.name);
    if (existing) {
        existing.qty += currentQty;
    } else {
        cart.push({ ...currentProduct, qty: currentQty });
    }
    saveCart();
    updateCartCount();
    closeModalBtn();
    renderCart();
    showToast(currentProduct.name + ' added to cart!');
}

// Toggle cart sidebar visibility
function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (!sidebar || !overlay) return;

    const isOpen = sidebar.classList.contains('open');
    sidebar.classList.toggle('open', !isOpen);
    overlay.classList.toggle('open', !isOpen);
    document.body.style.overflow = isOpen ? '' : 'hidden';
    if (!isOpen) renderCart(); // render when opening
}

// Render cart items and total
function renderCart() {
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
        if (totalEl) totalEl.textContent = '';
        return;
    }

    let total = 0;
    container.innerHTML = cart.map((item, i) => {
        const price = item.priceValue !== undefined ? item.priceValue : parsePrice(item.price);
        total += price * item.qty;
        return `
        <div class="cart-item">
            <img src="${item.img}" alt="${item.name}">
            <div class="cart-item-info">
                <p>${item.name}</p>
                <small>${item.price} × ${item.qty}</small>
            </div>
            <div class="cart-item-actions">
                <button onclick="changeCartQty(${i}, -1)">−</button>
                <span>${item.qty}</span>
                <button onclick="changeCartQty(${i}, 1)">+</button>
                <button class="remove-btn" onclick="removeFromCart(${i})">Remove</button>
            </div>
        </div>`;
    }).join('');

    if (totalEl) {
        totalEl.innerHTML = '<strong>Total: Rs. ' + total.toLocaleString() + '</strong>';
    }
}

// Change quantity of a cart item
function changeCartQty(index, delta) {
    if (!cart[index]) return;

    cart[index].qty = Math.max(1, cart[index].qty + delta);
    saveCart();
    updateCartCount();
    renderCart();
}

// Remove item from cart
function removeFromCart(index) {
    if (!cart[index]) return;

    cart.splice(index, 1);
    saveCart();
    updateCartCount();
    renderCart();
}

// Proceed to checkout
function proceedToCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty. Add items before checkout.');
        return;
    }
    const total = cart.reduce((sum, item) => {
        const price = item.priceValue !== undefined ? item.priceValue : parsePrice(item.price);
        return sum + price * item.qty;
    }, 0);
    renderCheckoutForm(total);
}

function renderCheckoutForm(total) {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    if (!cartSidebar || !cartOverlay) return;

    // Close sidebar
    cartSidebar.classList.remove('open');
    cartOverlay.classList.remove('open');

    // Create checkout overlay
    let overlay = document.getElementById('checkoutOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'checkoutOverlay';
        overlay.className = 'checkout-overlay';
        overlay.onclick = function(e) {
            if (e.target === overlay) closeCheckout();
        };
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
        <div class="checkout-content">
            <button class="modal-close" onclick="closeCheckout()" style="position:absolute;top:12px;right:12px;border:none;background-color:#413923;color:white;border-radius:50%;width:32px;height:32px;cursor:pointer;">✕</button>
            <div class="checkout-form-wrap">
                <h3>Checkout Details</h3>
                <p>Please enter your information and delivery address.</p>
                <div class="checkout-summary">Order Total: <strong>Rs. ${total.toLocaleString()}</strong></div>
                <form id="checkoutForm" class="checkout-form" onsubmit="confirmOrder(event)">
                    <label>
                        Full Name
                        <input type="text" id="checkoutName" placeholder="Enter your full name" required>
                    </label>
                    <label>
                        Phone Number
                        <input type="tel" id="checkoutPhone" placeholder="Enter your phone number" required>
                    </label>
                    <label>
                        Email Address
                        <input type="email" id="checkoutEmail" placeholder="Enter your email" required>
                    </label>
                    <label>
                        Delivery Address
                        <textarea id="checkoutAddress" rows="4" placeholder="House number, street, area" required></textarea>
                    </label>
                    <label>
                        City
                        <input type="text" id="checkoutCity" placeholder="Enter your city" required>
                    </label>
                    <div class="checkout-actions">
                        <button type="button" class="checkout-back-btn" onclick="closeCheckout()">Back to Cart</button>
                        <button type="submit" class="confirm-order-btn">Confirm Order</button>
                    </div>
                </form>
            </div>
        </div>`;

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCheckout() {
    const overlay = document.getElementById('checkoutOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
    document.body.style.overflow = '';
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartSidebar && cartOverlay) {
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('open');
    }
}

function confirmOrder(event) {
    event.preventDefault();
    const form = document.getElementById('checkoutForm');
    if (!form) return;
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    const customerName = document.getElementById('checkoutName').value.trim();
    cart = [];
    saveCart();
    updateCartCount();
    const overlay = document.getElementById('checkoutOverlay');
    if (overlay) {
        overlay.innerHTML = `
            <div class="checkout-content">
                <div class="order-success">
                    <div class="order-success-icon">✓</div>
                    <h3>Your order is confirmed!</h3>
                    <p>Thank you${customerName ? ', ' + customerName : ''}. Your order has been confirmed.</p>
                    <p>We will send you the delivery details and updates soon.</p>
                    <button class="checkout-btn" onclick="closeCheckoutAndContinue()" style="margin-top:16px;padding:12px 32px;border:none;background-color:#413923;color:white;border-radius:12px;cursor:pointer;font-size:15px;font-weight:bold;">Continue Shopping</button>
                </div>
            </div>`;
    }
    showToast('Order confirmed successfully!');
}

function closeCheckoutAndContinue() {
    closeCheckout();
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartSidebar && cartOverlay) {
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('open');
    }
}


// Show toast notification
function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

document.addEventListener('DOMContentLoaded', function () {
    setupProductSearch();
    const allCards = document.querySelectorAll('.Products .card');
    const loadMoreBtn = document.getElementById('load');
    if (loadMoreBtn) {
        const initialShow = 8;
        allCards.forEach((card, index) => {
            if (index >= initialShow) {
                card.style.display = 'none';
            }
        });
        loadMoreBtn.addEventListener('click', function () {
            allCards.forEach(card => {
                card.style.display = 'block';
            });
            loadMoreBtn.style.display = 'none';
        });
    }

    const loginBtn = document.getElementById('loginlogin');
    if (loginBtn) {
        const maillogin = document.getElementById('mail');
        const passlogin = document.getElementById('pass');
        loginBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (!maillogin.value || !passlogin.value) {
                alert('Please enter your email and password');
                return;
            }
            if (!maillogin.value.includes('@')) {
                alert('Please enter a valid email');
                return;
            }
            if (passlogin.value.length < 6) {
                alert('Please enter a password with at least 6 characters');
                return;
            }
            alert('Login Successfully');
            localStorage.setItem('isLoggedIn', 'true');
            window.location.href = '/index.html';
        });
    }

    // Signup form handler
    const signupBtn = document.getElementById('signupop');
    if (signupBtn) {
        const mail = document.getElementById('mailsignup');
        const pass = document.getElementById('passsignup');
        const name = document.getElementById('namesignup');
        const confirmPass = document.getElementById('confirmpass');
        signupBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (!mail.value || !pass.value || !confirmPass.value) {
                alert('Please enter your email, password, and confirm password');
                return;
            }
            if (!name.value) {
                alert('Please enter your name');
                return;
            }
            if (!mail.value.includes('@')) {
                alert('Please enter a valid email');
                return;
            }
            if (pass.value.length < 6) {
                alert('Please enter a password with at least 6 characters');
                return;
            }
            if (pass.value !== confirmPass.value) {
                alert('Passwords do not match');
                return;
            }
            alert('Sign Up Successfully');
            localStorage.setItem('isLoggedIn', 'true');
            window.location.href = '/index.html';
        });
    }

    // Newsletter subscription
    const mailsubscribe = document.getElementById('mailsubscribe');
    const subscribeBtn = document.getElementById('subscribe');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (!mailsubscribe.value) {
                alert('Please enter your email');
                return;
            }
            if (!mailsubscribe.value.includes('@')) {
                alert('Please enter a valid email');
                return;
            }
            alert(' Thank You for Subscribe, We will send you updates and promotions.');
        });
    }

    // Load more reviews
    const loadReviewsBtn = document.getElementById('loadreviews');
    const allReviews = document.querySelectorAll('.reviewcontainer .review1');
    if (loadReviewsBtn) {
        const initialShow = 4;
        allReviews.forEach((review, index) => {
            if (index >= initialShow) {
                review.style.display = 'none';
            }
        });
        loadReviewsBtn.addEventListener('click', function () {
            allReviews.forEach(review => {
                review.style.display = 'block';
            });
            loadReviewsBtn.style.display = 'none';
        });
    }

    // Login/logout UI sync
    const loginDiv = document.getElementById('loginid');
    const signupDiv = document.getElementById('signupid');
    const logoutDiv = document.getElementById('logoutClick');
    if (loginDiv) {
        if (logoutDiv) logoutDiv.style.display = 'none';
        if (localStorage.getItem('isLoggedIn') === 'true') {
            loginDiv.style.display = 'none';
            signupDiv.style.display = 'none';
            if (logoutDiv) logoutDiv.style.display = 'block';
        }
        const logoutClick = document.getElementById('logoutClick');
        if (logoutClick) {
            logoutClick.addEventListener('click', function () {
                localStorage.removeItem('isLoggedIn');
                loginDiv.style.display = 'block';
                signupDiv.style.display = 'block';
                logoutDiv.style.display = 'none';
                alert('Logout Successfully');
            });
        }
    }

    // Initialize cart count on page load
    updateCartCount();
});
