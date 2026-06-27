const ANKI_CONNECT_URL = 'http://127.0.0.1:8765';

function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;"); }

function addRow(values){
  const tbody = document.querySelector('#words-table tbody');
  const tr = document.createElement('tr');
  const v = values || ['', '', '', '', '', ''];
  tr.innerHTML = `
    <td><input name="word[]" class="form-control" value="${escapeHtml(v[0])}"/></td>
    <td><input name="type[]" class="form-control" value="${escapeHtml(v[1])}"/></td>
    <td><input name="onyomi[]" class="form-control" value="${escapeHtml(v[2])}"/></td>
    <td><input name="kunyomi[]" class="form-control" value="${escapeHtml(v[3])}"/></td>
    <td><input name="meaning[]" class="form-control" value="${escapeHtml(v[4])}"/></td>
    <td><input name="sentence[]" class="form-control" value="${escapeHtml(v[5])}"/></td>
    <td><button type="button" class="btn btn-sm btn-danger" onclick="removeRow(this)">Remove</button></td>
  `;
  tbody.appendChild(tr);
}

function removeRow(btn){ btn.closest('tr').remove(); }
function clearTable(){ document.querySelector('#words-table tbody').innerHTML = ''; }

function fillTableFromCSV(){
  const text = document.getElementById('csvtext').value;
  const delim = document.getElementById('delimiter').value || ',';
  if(!text) return;
  clearTable();
  const lines = text.split(/\r?\n/);
  lines.forEach(line => { if(!line.trim()) return; const parts = line.split(delim).map(s=>s.trim()); addRow(parts); });
}

function loadFile(evt){
  const f = evt.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = e => { document.getElementById('csvtext').value = e.target.result; };
  reader.readAsText(f);
}

function alertMsg(msg, type='info'){
  const el = document.getElementById('alerts');
  const div = document.createElement('div');
  div.className = `alert alert-${type} mt-2`;
  div.textContent = msg;
  el.appendChild(div);
  setTimeout(()=>div.remove(), 8000);
}

async function checkAnki(){
  try{
    const payload = { action: 'version', version: 6 };
    const res = await fetch(ANKI_CONNECT_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    if(data.error) throw new Error(data.error);
    alertMsg('AnkiConnect reachable. Version: '+data.result, 'success');
  }catch(e){
    alertMsg('AnkiConnect unreachable: '+e.message, 'danger');
  }
}

async function sendToAnki(){
  const deck = document.getElementById('deck').value || '日次漢字';
  const model = document.getElementById('model').value || 'マイ漢字';
  const tags = document.getElementById('tags').value.split(',').map(t=>t.trim()).filter(Boolean);
  const audioUrl = document.getElementById('audio-url').value.trim();
  const audioFilename = document.getElementById('audio-filename').value.trim();
  const audioSkipHash = document.getElementById('audio-skiphash').value.trim();
  const audio = audioUrl ? { url: audioUrl, filename: audioFilename || audioUrl.split('/').pop() || 'audio.mp3', skipHash: audioSkipHash || '', fields: ['Words'] } : undefined;

  const rows = [];
  document.querySelectorAll('#words-table tbody tr').forEach(tr=>{
    const inputs = tr.querySelectorAll('input');
    const values = Array.from(inputs).map(i=>i.value||'');
    if(values.every(v=>!v.trim())) return;
    rows.push(values);
  });
  if(!rows.length){ alertMsg('No rows to import', 'warning'); return; }

  let added = 0;
  let errors = [];

  for(const r of rows){
    const note = {
      deckName: deck,
      modelName: model,
      fields: {
        words: r[0] || '',
        type: r[1] || '',
        onyomi: r[2] || '',
        kunyomi: r[3] || '',
        meaning: r[4] || '',
        sentence: r[5] || ''
      },
      tags,
      ...(audio ? { audio } : {})
    };

    const payload = { action:'addNote', version:6, params:{ note } };

    try{
      const res = await fetch(ANKI_CONNECT_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if(!res.ok) throw new Error('HTTP '+res.status);
      const data = await res.json();
      if(data.error) throw new Error(data.error);
      if(data.result) added += 1;
    }catch(e){
      errors.push(`Row ${rows.indexOf(r) + 1}: ${e.message}`);
    }
  }

  if(errors.length){
    alertMsg(`Imported ${added}/${rows.length} notes. Errors: ${errors.join(' | ')}`, 'warning');
  } else {
    alertMsg(`Imported ${added}/${rows.length} notes successfully.`, 'success');
  }
}

function exportCSV(){
  const rows = [];
  document.querySelectorAll('#words-table tbody tr').forEach(tr=>{
    const inputs = tr.querySelectorAll('input');
    const values = Array.from(inputs).map(i=>i.value||'');
    if(values.every(v=>!v.trim())) return;
    rows.push(values.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','));
  });
  if(!rows.length){ alertMsg('No rows to export', 'warning'); return; }
  const blob = new Blob([rows.join('\n')], { type:'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'anki_import.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function moveFocusBetweenRows(input, direction){
  const currentRow = input.closest('tr');
  const rowElements = Array.from(currentRow.parentElement.children);
  const rowIndex = rowElements.indexOf(currentRow);
  const inputElements = Array.from(currentRow.querySelectorAll('input'));
  const columnIndex = inputElements.indexOf(input);

  if(columnIndex < 0) return;

  const targetRowIndex = direction === 'up' ? rowIndex - 1 : rowIndex + 1;
  const targetRow = rowElements[targetRowIndex];
  if(!targetRow) return;

  const targetInput = targetRow.querySelectorAll('input')[columnIndex];
  if(targetInput){
    targetInput.focus();
    targetInput.select();
  }
}

// wire buttons
window.addRow = addRow; window.removeRow = removeRow; window.clearTable = clearTable; window.fillTableFromCSV = fillTableFromCSV; window.loadFile = loadFile; window.sendToAnki = sendToAnki; window.exportCSV = exportCSV; window.checkAnki = checkAnki;

window.addEventListener('load', ()=>{
  document.getElementById('check-anki').addEventListener('click', checkAnki);

  const tableBody = document.querySelector('#words-table tbody');

  // Move focus between rows with the arrow keys while keeping the same column.
  tableBody.addEventListener('keydown', (e) => {
    if(!e.target.matches('#words-table input')) return;
    if(e.key === 'ArrowUp' || e.key === 'ArrowDown'){
      e.preventDefault();
      moveFocusBetweenRows(e.target, e.key === 'ArrowUp' ? 'up' : 'down');
    }
  });

  // On Enter, keep the current text and move the caret to the end of the field.
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' && e.target.matches('#words-table input, #words-table textarea')){
      e.preventDefault();
      e.target.focus();
      const end = e.target.value.length;
      if(typeof e.target.setSelectionRange === 'function'){
        e.target.setSelectionRange(end, end);
      } else {
        e.target.selectionStart = end;
        e.target.selectionEnd = end;
      }
    }
  });
});
