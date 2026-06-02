/* =============================================
   auth.js
   Sign-in, Sign-up, and Logout logic.
   ============================================= */

function switchAuth(tab) {
  document.querySelectorAll('.auth-tab').forEach((t, i) =>
    t.classList.toggle('active', i === (tab === 'login' ? 0 : 1))
  );
  document.getElementById('login-form').classList.toggle('active', tab === 'login');
  document.getElementById('signup-form').classList.toggle('active', tab === 'signup');
}

function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pw    = document.getElementById('login-pw').value;
  if (!email) { showToast('Please enter your email'); return; }
  if (!pw)    { showToast('Please enter your password'); return; }
  const name = email.split('@')[0]
    .replace(/[^a-zA-Z ]/g, ' ').trim()
    .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'User';
  loginUser(name);
}

function handleSignup() {
  const name  = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pw    = document.getElementById('signup-pw').value;
  const terms = document.getElementById('terms').checked;
  if (!name)                   { showToast('Please enter your name'); return; }
  if (!email || !email.includes('@')) { showToast('Please enter a valid email'); return; }
  if (pw.length < 8)           { showToast('Password must be at least 8 characters'); return; }
  if (!terms)                  { showToast('Please accept the Terms of Service'); return; }
  loginUser(name);
}

function loginUser(name) {
  currentUser = name;
  document.getElementById('auth-screen').style.display = 'none';
  seedData();
  enterApp();
}

function doLogout() {
  document.getElementById('app').classList.remove('visible');
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  document.body.removeAttribute('data-theme');
  currentTheme  = 'light';
  selectedTheme = 'light';
}
