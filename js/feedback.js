/* =============================================
   feedback.js
   Feedback panel — star ratings, checkboxes,
   radio buttons, sliders, and form submission.
   ============================================= */

function rate(type, val) {
  ratings[type] = val;
  document.getElementById('stars-' + type)
    .querySelectorAll('.star')
    .forEach((s, i) => s.classList.toggle('lit', i < val));
}

function toggleCheck(el) {
  el.classList.toggle('checked');
  el.querySelector('input').checked = el.classList.contains('checked');
}

function selectRadio(group, el) {
  const groupId = group === 'usertype' ? 'user-type-group' : 'freq-group';
  document.querySelectorAll(`#${groupId} .radio-opt`).forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
}

function submitFeedback() {
  if (!ratings.overall) { showToast('Please rate your overall satisfaction'); return; }

  document.getElementById('feedback-success').classList.add('show');

  // Reset ratings
  ['overall', 'ease', 'design'].forEach(t => {
    ratings[t] = 0;
    document.getElementById('stars-' + t).querySelectorAll('.star').forEach(s => s.classList.remove('lit'));
  });

  // Reset sliders
  document.getElementById('usability-slider').value = 7;
  document.getElementById('usability-val').textContent = '7';
  document.getElementById('nps-slider').value = 8;
  document.getElementById('nps-val').textContent = '8';

  // Reset checkboxes and radio buttons
  document.querySelectorAll('.check-item').forEach(c => {
    c.classList.remove('checked');
    c.querySelector('input').checked = false;
  });
  document.querySelectorAll('.radio-opt').forEach(r => r.classList.remove('selected'));

  // Reset textareas
  ['fb-liked', 'fb-improve', 'fb-other'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  setTimeout(() => document.getElementById('feedback-success').classList.remove('show'), 5000);
}