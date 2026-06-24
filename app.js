// Court Role Book - single-file app logic
// Data store key
const STORAGE_KEY = 'courtData_v1';
const SETTINGS_KEY = 'courtSettings_v1';

// Next step choices
const NEXT_STEPS = ['Trial','Defense Trial','Submission','Argument/Inquiry','Calling'];

// Utility date helpers (dd/mm/yyyy)
function toISO(dmy){
  if(!dmy) return null;
  // accept dd/mm/yyyy or yyyy-mm-dd
  if(/^\d{4}-\d{2}-\d{2}$/.test(dmy)) return dmy;
  const m = dmy.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(!m) return null;
  const dd = m[1].padStart(2,'0'), mm = m[2].padStart(2,'0'), yyyy = m[3];
  return `${yyyy}-${mm}-${dd}`;
}
function fromISO(iso){
  if(!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}
function todayISO(){ return new Date().toISOString().slice(0,10); }

// Data model: object keyed by caseNumber
function loadData(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return {};
    return JSON.parse(raw);
  }catch(e){console.error(e); return {};}
}
function saveData(data){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Settings (Google Sheet URL, autosync)
function loadSettings(){
  try{ const raw = localStorage.getItem(SETTINGS_KEY); return raw?JSON.parse(raw):{} }catch(e){return{}};
}
function saveSettings(s){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }

// Add or update a case. preserves history array of prior nextDate/nextStep entries.
function addOrUpdateCase(caseNumber, nextDateISO, nextStep){
  const data = loadData();
  const key = caseNumber.trim();
  if(!key) return false;
  const now = new Date().toISOString();
  if(!data[key]){
    data[key] = { caseNumber: key, nextDate: nextDateISO, nextStep, history: [] };
  }else{
    // record previous state into history only if changed
    const prev = { nextDate: data[key].nextDate, nextStep: data[key].nextStep, updatedAt: now };
    if(prev.nextDate || prev.nextStep) data[key].history = data[key].history || [], data[key].history.push(prev);
    data[key].nextDate = nextDateISO;
    data[key].nextStep = nextStep;
  }
  saveData(data);
  return true;
}

// For a given date ISO, return array of cases (objects)
function getCasesForDate(dateISO){
  const data = loadData();
  return Object.values(data).filter(c => c.nextDate === dateISO).sort((a,b)=>a.caseNumber.localeCompare(b.caseNumber));
}

// Return data entry for a case number or null
function getCase(caseNumber){
  const data = loadData();
  return data[caseNumber] || null;
}

// Calendar UI
let current = new Date();
current.setDate(1);
function renderCalendar(){
  const calendarEl = document.getElementById('calendar');
  calendarEl.innerHTML = '';
  const monthLabel = document.getElementById('monthLabel');
  const year = current.getFullYear(), month = current.getMonth();
  monthLabel.textContent = current.toLocaleString(undefined,{month:'long',year:'numeric'});
  // day headers
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  for(const d of days){
    const h = document.createElement('div');
    h.className='day-header';
    h.textContent = d;
    calendarEl.appendChild(h);
  }
  // first day index
  const firstDay = new Date(year,month,1).getDay();
  // days in month
  const daysInMonth = new Date(year, month+1,0).getDate();
  // previous month's days to fill
  const prevDays = firstDay;
  const totalCells = Math.ceil((prevDays + daysInMonth)/7)*7;
  // start from previous month
  const startDate = new Date(year,month,1 - prevDays);
  for(let i=0;i<totalCells;i++){
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()+i);
    const cell = document.createElement('div');
    cell.className = 'cell';
    if(d.getMonth() !== month) cell.classList.add('other-month');
    if(d.toISOString().slice(0,10) === todayISO()) cell.classList.add('today');
    const dd = document.createElement('div');
    dd.className='dateNum';
    dd.textContent = d.getDate();
    cell.appendChild(dd);

    // show badge count if cases exist for that date
    const cases = getCasesForDate(d.toISOString().slice(0,10));
    if(cases.length){
      const badge = document.createElement('div');
      badge.className='badge';
      badge.textContent = `${cases.length} case${cases.length>1?'s':''}`;
      cell.appendChild(badge);
    }

    cell.addEventListener('click', ()=>onDateClick(d));
    calendarEl.appendChild(cell);
  }
}

function onDateClick(d){
  const iso = d.toISOString().slice(0,10);
  const label = document.getElementById('selectedDateLabel');
  label.textContent = `Cases for ${fromISO(iso)}`;
  document.getElementById('exports').style.display='block';
  renderCaseListsForDate(iso);
  // store selected for export
  document._selectedDateISO = iso;
}

function renderCaseListsForDate(iso){
  const lists = document.getElementById('caseLists');
  lists.innerHTML = '';
  const cases = getCasesForDate(iso);
  // group by nextStep
  const groups = {};
  for(const c of cases){
    const step = c.nextStep || 'Unspecified';
    groups[step] = groups[step] || [];
    groups[step].push(c);
  }
  if(cases.length===0){
    lists.textContent = 'No cases for this date';
    return;
  }
  for(const step of Object.keys(groups)){
    const div = document.createElement('div');
    div.className='category';
    const h = document.createElement('h3');
    h.textContent = `${step} (${groups[step].length})`;
    div.appendChild(h);
    for(const c of groups[step]){
      const row = document.createElement('div');
      row.className='case-row';
      const left = document.createElement('div');
      left.innerHTML = `<strong>${c.caseNumber}</strong><div class="meta">Next Date: ${fromISO(c.nextDate)} · Next Step: ${c.nextStep}</div>`;
      const right = document.createElement('div');
      const btn = document.createElement('button');
      btn.textContent = 'Update';
      btn.addEventListener('click', ()=>openModalForCase(c.caseNumber));
      right.appendChild(btn);
      row.appendChild(left);
      row.appendChild(right);
      div.appendChild(row);
    }
    lists.appendChild(div);
  }
}

// Modal logic
function openModalForCase(caseNumber){
  const modal = document.getElementById('modal');
  document.getElementById('modalCase').textContent = caseNumber;
  document.getElementById('modalDate').value = '';
  document.getElementById('modalStep').value = NEXT_STEPS[0];
  modal.classList.remove('hidden');
  document._modalCase = caseNumber;
}
function closeModal(){ document.getElementById('modal').classList.add('hidden'); document._modalCase = null; }

// Exports
function exportExcelForSelected(){
  const iso = document._selectedDateISO;
  if(!iso){ alert('Select a date first'); return; }
  const cases = getCasesForDate(iso);
  const aoa = [['Case Number','Next Date','Next Step']];
  for(const c of cases) aoa.push([c.caseNumber, fromISO(c.nextDate), c.nextStep]);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'CourtList');
  XLSX.writeFile(wb, `CourtList_${iso}.xlsx`);
}
function exportPdfForSelected(){
  const iso = document._selectedDateISO;
  if(!iso){ alert('Select a date first'); return; }
  const cases = getCasesForDate(iso);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(`Court List for ${fromISO(iso)}`, 10, 12);
  doc.setFontSize(10);
  let y = 20;
  for(const c of cases){
    const line = `${c.caseNumber} — ${c.nextStep}`;
    doc.text(line, 10, y);
    doc.text(`Next Date: ${fromISO(c.nextDate)}`, 140, y);
    y += 8;
    if(y>280){ doc.addPage(); y=10; }
  }
  doc.save(`CourtList_${iso}.pdf`);
}
function exportDocForSelected(){
  const iso = document._selectedDateISO;
  if(!iso){ alert('Select a date first'); return; }
  const cases = getCasesForDate(iso);
  let html = `<html><head><meta charset='utf-8'><title>CourtList</title></head><body><h2>Court List for ${fromISO(iso)}</h2><table border="1" cellpadding="6" cellspacing="0"><tr><th>Case Number</th><th>Next Date</th><th>Next Step</th></tr>`;
  for(const c of cases){
    html += `<tr><td>${c.caseNumber}</td><td>${fromISO(c.nextDate)}</td><td>${c.nextStep}</td></tr>`;
  }
  html += `</table></body></html>`;
  const blob = new Blob([html], {type:'application/msword'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CourtList_${iso}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

// Import spreadsheet (uses SheetJS)
async function importFile(file){
  const reader = new FileReader();
  reader.onload = (e)=>{
    const data = e.target.result;
    const workbook = XLSX.read(data, {type: 'binary'});
    const sheetName = workbook.SheetNames[0];
    const ws = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(ws, {raw:false});
    // Expect columns: Case Number, Next Date, Next Step (best effort)
    let imported = 0;
    for(const r of json){
      const caseNumber = r['Case Number'] || r['case number'] || r['case'] || r['Case'] || r['caseNumber'];
      const nextDate = r['Next Date'] || r['next date'] || r['NextDate'] || r['nextDate'] || r['Date'];
      const nextStep = r['Next Step'] || r['next step'] || r['NextStep'] || r['Step'] || r['nextStep'];
      if(!caseNumber || !nextDate) continue;
      const iso = toISO(String(nextDate).trim());
      const step = NEXT_STEPS.includes(nextStep) ? nextStep : (nextStep || NEXT_STEPS[0]);
      addOrUpdateCase(String(caseNumber).trim(), iso, step);
      imported++;
    }
    alert(`Imported ${imported} rows`);
    renderCalendar();
  };
  // read as binary string for SheetJS
  reader.readAsBinaryString(file);
}

async function importGoogleSheetCsv(url){
  try{
    const res = await fetch(url);
    if(!res.ok) throw new Error('Unable to fetch CSV');
    const text = await res.text();
    // convert CSV to worksheet
    const ws = XLSX.utils.csv_to_sheet(text);
    const json = XLSX.utils.sheet_to_json(ws, {raw:false});
    let imported = 0;
    for(const r of json){
      const caseNumber = r['Case Number'] || r['case number'] || r['case'] || r['Case'] || r['caseNumber'];
      const nextDate = r['Next Date'] || r['next date'] || r['NextDate'] || r['nextDate'] || r['Date'];
      const nextStep = r['Next Step'] || r['next step'] || r['NextStep'] || r['Step'] || r['nextStep'];
      if(!caseNumber || !nextDate) continue;
      const iso = toISO(String(nextDate).trim());
      const step = NEXT_STEPS.includes(nextStep) ? nextStep : (nextStep || NEXT_STEPS[0]);
      addOrUpdateCase(String(caseNumber).trim(), iso, step);
      imported++;
    }
    alert(`Imported ${imported} rows from Google Sheet`);
    renderCalendar();
  }catch(e){ alert('Import failed: '+e.message); }
}

// Auto-sync
let autoSyncTimer = null;
function startAutoSync(url, minutes){
  stopAutoSync();
  if(!url) return;
  const ms = Math.max(1, minutes) * 60 * 1000;
  autoSyncTimer = setInterval(()=>{
    importGoogleSheetCsv(url);
  }, ms);
}
function stopAutoSync(){ if(autoSyncTimer) clearInterval(autoSyncTimer), autoSyncTimer=null; }

// UI wiring
document.addEventListener('DOMContentLoaded', ()=>{
  // render initial calendar
  renderCalendar();

  // restore settings
  const settings = loadSettings();
  if(settings.gsUrl) document.getElementById('gsUrl').value = settings.gsUrl;
  if(settings.autoSync) document.getElementById('autoSync').checked = true;
  if(settings.autoInterval) document.getElementById('autoInterval').value = settings.autoInterval;
  if(settings.autoSync && settings.gsUrl){ startAutoSync(settings.gsUrl, settings.autoInterval||15); }

  // month nav
  document.getElementById('prevMonth').addEventListener('click', ()=>{
    current.setMonth(current.getMonth()-1); renderCalendar();
  });
  document.getElementById('nextMonth').addEventListener('click', ()=>{
    current.setMonth(current.getMonth()+1); renderCalendar();
  });

  // add case form
  document.getElementById('addCaseForm').addEventListener('submit', e=>{
    e.preventDefault();
    const caseNumber = document.getElementById('caseNumber').value.trim();
    const dateRaw = document.getElementById('nextDate').value.trim();
    const step = document.getElementById('nextStep').value;
    if(!caseNumber || !dateRaw){ alert('Case Number and Next Date are required'); return; }
    const iso = toISO(dateRaw);
    if(!iso){ alert('Invalid date format. Use DD/MM/YYYY'); return; }
    addOrUpdateCase(caseNumber, iso, step);
    alert('Saved');
    document.getElementById('addCaseForm').reset();
    renderCalendar();
    // if selected date equals the new date, refresh list
    if(document._selectedDateISO === iso) renderCaseListsForDate(iso);
  });

  // modal
  document.getElementById('modalClose').addEventListener('click', ()=>{ closeModal(); });
  document.getElementById('modalForm').addEventListener('submit', e=>{
    e.preventDefault();
    const caseNumber = document._modalCase;
    const dateRaw = document.getElementById('modalDate').value.trim();
    const step = document.getElementById('modalStep').value;
    if(!caseNumber || !dateRaw){ alert('Case Number and Next Date required'); return; }
    const iso = toISO(dateRaw);
    if(!iso){ alert('Invalid date format'); return; }
    addOrUpdateCase(caseNumber, iso, step);
    alert('Updated');
    closeModal();
    renderCalendar();
    if(document._selectedDateISO) renderCaseListsForDate(document._selectedDateISO);
  });

  // search
  document.getElementById('searchBtn').addEventListener('click', ()=>{
    const key = document.getElementById('searchCase').value.trim();
    if(!key){ alert('Enter a case number'); return; }
    const c = getCase(key);
    const details = document.getElementById('caseDetails');
    details.innerHTML = '';
    if(!c){ details.textContent = 'No such case'; return; }
    const h = document.createElement('div');
    h.innerHTML = `<strong>${c.caseNumber}</strong><div class="meta">Current Next Date: ${fromISO(c.nextDate)} · Next Step: ${c.nextStep}</div>`;
    details.appendChild(h);
    if(c.history && c.history.length){
      const histTitle = document.createElement('div'); histTitle.style.marginTop='8px'; histTitle.textContent = 'History:';
      details.appendChild(histTitle);
      for(const row of c.history.slice().reverse()){
        const r = document.createElement('div');
        r.className='case-row';
        r.innerHTML = `<div>${fromISO(row.nextDate)} · ${row.nextStep || ''} <div class="meta">Updated at: ${row.updatedAt || ''}</div></div>`;
        details.appendChild(r);
      }
    }else{
      const none = document.createElement('div'); none.textContent='No history found';
      details.appendChild(none);
    }
  });

  // imports
  document.getElementById('importBtn').addEventListener('click', ()=>{
    const f = document.getElementById('importFile').files[0];
    if(!f){ alert('Choose a file'); return; }
    importFile(f);
  });
  document.getElementById('importGsBtn').addEventListener('click', ()=>{
    const url = document.getElementById('gsUrl').value.trim();
    if(!url){ alert('Paste Google Sheets CSV export URL'); return; }
    // save settings
    const s = loadSettings(); s.gsUrl = url; saveSettings(s);
    importGoogleSheetCsv(url);
  });

  // auto sync toggle
  document.getElementById('autoSync').addEventListener('change', (e)=>{
    const enabled = e.target.checked;
    const url = document.getElementById('gsUrl').value.trim();
    const minutes = parseInt(document.getElementById('autoInterval').value || '15',10);
    const s = loadSettings(); s.autoSync = enabled; s.autoInterval = minutes; s.gsUrl = url; saveSettings(s);
    if(enabled){ if(!url){ alert('Set Google Sheet CSV URL first'); document.getElementById('autoSync').checked=false; return; } startAutoSync(url, minutes); }
    else stopAutoSync();
  });

  // exports
  document.getElementById('exportExcel').addEventListener('click', exportExcelForSelected);
  document.getElementById('exportPdf').addEventListener('click', exportPdfForSelected);
  document.getElementById('exportDoc').addEventListener('click', exportDocForSelected);

  // register service worker for PWA
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').then(()=>console.log('sw ok')).catch(e=>console.warn('sw fail',e));
  }
});
