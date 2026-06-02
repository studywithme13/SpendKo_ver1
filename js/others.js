/* =============================================
   others.js  —  Notes & Checklists tab
   Supports two item types:
     checklist  — tickable to-do / grocery items
     notepad    — free-text notes / ideas
   ============================================= */

function openNewNoteModal()  { document.getElementById('new-note-modal').classList.add('open');    }
function closeNewNoteModal() { document.getElementById('new-note-modal').classList.remove('open'); }

function saveNewNote() {
  const title= document.getElementById('nn-title').value.trim();
  const type = document.getElementById('nn-type').value;
  if (!title) { showToast('Please enter a title'); return; }
  notes.push({
    id: nextId++,
    title,
    type,             /* 'checklist' | 'notepad' */
    items: [],        /* checklist items */
    body: '',         /* notepad text */
    createdAt: new Date().toISOString().split('T')[0]
  });
  closeNewNoteModal();
  document.getElementById('nn-title').value='';
  renderOthers();
  showToast(`${type==='checklist'?'Checklist':'Notepad'} created!`);
}

function deleteNote(id) {
  notes=notes.filter(n=>n.id!==id);
  renderOthers();
  showToast('Deleted.');
}

/* ── Checklist item actions ── */
function addCheckItem(noteId) {
  const inp=document.getElementById('ci-new-'+noteId);
  const val=inp.value.trim();
  if (!val) { showToast('Enter an item'); return; }
  const note=notes.find(n=>n.id===noteId);
  if (!note) return;
  note.items.push({ id:nextId++, text:val, done:false });
  inp.value='';
  renderOthers();
}

function toggleCheckItem(noteId, itemId) {
  const note=notes.find(n=>n.id===noteId);
  if (!note) return;
  const item=note.items.find(i=>i.id===itemId);
  if (!item) return;
  item.done=!item.done;
  renderOthers();
}

function deleteCheckItem(noteId, itemId) {
  const note=notes.find(n=>n.id===noteId);
  if (!note) return;
  note.items=note.items.filter(i=>i.id!==itemId);
  renderOthers();
}

function clearDoneItems(noteId) {
  const note=notes.find(n=>n.id===noteId);
  if (!note) return;
  note.items=note.items.filter(i=>!i.done);
  renderOthers();
  showToast('Cleared completed items.');
}

/* ── Notepad auto-save ── */
function saveNoteBody(noteId, val) {
  const note=notes.find(n=>n.id===noteId);
  if (note) note.body=val;
}

/* ── Render ── */
function renderOthers() {
  const container=document.getElementById('others-lists-container');
  if (!container) return;

  if (!notes.length) {
    container.innerHTML=`<div class="others-empty">
      <div class="others-empty-icon">📋</div>
      <div class="others-empty-title">Nothing here yet</div>
      <div class="others-empty-sub">Create a <strong>Checklist</strong> for groceries, errands, or to-dos.<br>
      Or a <strong>Notepad</strong> for ideas, reminders, or anything on your mind.</div></div>`;
    return;
  }

  container.innerHTML=notes.map(note=>{
    if (note.type==='checklist') {
      const total=note.items.length, done=note.items.filter(i=>i.done).length;
      const pct=total?Math.round((done/total)*100):0;
      const itemsHtml=note.items.length
        ? note.items.map(item=>`
            <div class="sli${item.done?' checked':''}" id="sli-row-${item.id}">
              <input type="checkbox" class="sli-check" ${item.done?'checked':''}
                onchange="toggleCheckItem(${note.id},${item.id})">
              <div class="sli-name">${item.text}</div>
              <button class="sli-del" onclick="deleteCheckItem(${note.id},${item.id})">✕</button>
            </div>`).join('')
        : `<div class="slc-empty">No items yet — add one below.</div>`;

      return `<div class="spending-list-card">
        <div class="slc-header">
          <div class="slc-header-left">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:18px">✅</span>
              <div class="slc-name">${note.title}</div>
              <span class="badge badge-income" style="font-size:11px">Checklist</span>
            </div>
            <div class="slc-cat" style="margin-top:4px">Created ${note.createdAt} · ${done}/${total} done</div>
            ${total?`<div style="height:4px;background:var(--bg3);border-radius:2px;margin-top:6px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:var(--accent2);border-radius:2px;transition:width .4s"></div></div>`:''}
          </div>
        </div>
        <div class="slc-items">${itemsHtml}</div>
        <div class="slc-add-item-row">
          <input class="slc-add-input" type="text" id="ci-new-${note.id}"
            placeholder="Add item…" onkeydown="if(event.key==='Enter')addCheckItem(${note.id})">
          <button class="slc-add-btn" onclick="addCheckItem(${note.id})">+ Add</button>
        </div>
        <div class="slc-footer">
          ${done?`<button class="btn-clear-checked" onclick="clearDoneItems(${note.id})">🗑 Clear ${done} done</button>`:''}
          <button class="btn-delete-list" onclick="deleteNote(${note.id})">Delete</button>
        </div></div>`;
    }

    /* ── Notepad ── */
    return `<div class="spending-list-card">
      <div class="slc-header">
        <div class="slc-header-left">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:18px">📝</span>
            <div class="slc-name">${note.title}</div>
            <span class="badge badge-expense" style="font-size:11px;background:var(--info2);color:var(--info)">Notepad</span>
          </div>
          <div class="slc-cat" style="margin-top:4px">Created ${note.createdAt}</div>
        </div>
      </div>
      <div style="padding:12px 20px">
        <textarea class="feedback-textarea" style="min-height:140px;width:100%"
          placeholder="Write anything here — ideas, reminders, notes…"
          oninput="saveNoteBody(${note.id},this.value)">${note.body}</textarea>
      </div>
      <div class="slc-footer">
        <button class="btn-delete-list" onclick="deleteNote(${note.id})">Delete</button>
      </div></div>`;
  }).join('');
}
