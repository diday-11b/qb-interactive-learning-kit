import {randomIndex, eligibleMembers, targetRotation} from './core.js';

const get = id => document.getElementById(id);
const key = 'qb.wheel-spin-carnival.v1';
const palette = ['#4735a9','#a12762','#216471','#1e639f','#943e1e','#247048','#7c3a91','#8a4d0f'];
const limit = 300;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const canvas = get('wheel');
const ctx = canvas.getContext('2d');
const modal = get('winner');
const state = restore();
let rotation = 0;
let spinning = false;
let winner = null;
let audio;
let toastTimer;
let nextId = state.nextId;

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && Array.isArray(saved.members) && Array.isArray(saved.history) &&
        Number.isSafeInteger(saved.nextId) && saved.members.every(validEntry) &&
        saved.history.every(validEntry) && new Set(saved.members.map(member => member.id)).size === saved.members.length &&
        [...saved.members,...saved.history].every(entry => entry.id < saved.nextId)) {
      return {...saved, mode:saved.mode === 'unique' ? 'unique' : 'repeat', muted:saved.muted === true};
    }
  } catch {}
  return {members:[], history:[], mode:'repeat', muted:false, nextId:1};
}

function validEntry(entry) {
  return entry && Number.isSafeInteger(entry.id) && entry.id > 0 &&
    typeof entry.name === 'string' && entry.name.length > 0 && entry.name.length <= 120;
}

function save() {
  state.nextId = nextId;
  try { localStorage.setItem(key, JSON.stringify(state)); }
  catch { toast('Browser storage is unavailable. Changes may be lost when you close this page.'); }
}

function toast(message) {
  clearTimeout(toastTimer);
  get('toast').textContent = message;
  toastTimer = setTimeout(() => { get('toast').textContent = ''; }, 3800);
}

function make(tag, text) {
  const element = document.createElement(tag);
  element.textContent = text;
  return element;
}

function action(label, handler) {
  const button = make('button', label);
  button.type = 'button';
  button.addEventListener('click', handler);
  return button;
}

function eligible() {
  return eligibleMembers(state.members, state.history, state.mode);
}

function draw(members, angle) {
  ctx.clearRect(0, 0, 800, 800);
  ctx.save();
  ctx.translate(400,400);
  ctx.rotate(angle * Math.PI / 180);
  const step = 2 * Math.PI / Math.max(1,members.length);
  const segments = members.length ? members : [{name:'Add members to begin', color:0}];
  segments.forEach((member,index) => {
    const start = index * step - Math.PI / 2;
    const color = palette[member.color] || palette[index % palette.length];
    const fill = ctx.createRadialGradient(0,0,50,0,0,396);
    fill.addColorStop(0,'#29234c');
    fill.addColorStop(1,color);
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,396,start,start + step);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = '#ffffff9c';
    ctx.lineWidth = members.length > 48 ? 1 : 3;
    ctx.stroke();
    ctx.save();
    ctx.rotate(start + step / 2);
    const fontSize = Math.max(8, Math.min(31, 1200 / segments.length));
    ctx.font = '700 ' + fontSize + 'px system-ui';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    let label = member.name;
    const fit = members.length > 70 ? 185 : 245;
    if (ctx.measureText(label).width > fit) {
      const chars = Array.from(label);
      do { chars.pop(); label = chars.join('') + '…'; } while (chars.length && ctx.measureText(label).width > fit);
    }
    if (Math.cos(start + step / 2 + angle * Math.PI / 180) < 0) {
      ctx.translate(240,0);
      ctx.rotate(Math.PI);
      ctx.fillText(label,0,0);
    } else ctx.fillText(label,240,0);
    ctx.restore();
  });
  ctx.restore();
}

function render({keepWheel = false} = {}) {
  const active = eligible();
  const filter = get('search').value.trim().toLocaleLowerCase();
  const rows = state.members.flatMap((member,index) => {
    if (!member.name.toLocaleLowerCase().includes(filter)) return [];
    const row = make('li','');
    row.value = index + 1;
    const group = make('div','');
    group.className = 'member';
    const name = make('span',member.name);
    if (state.mode === 'unique' && !active.includes(member)) name.append(make('small','Already selected'));
    const edit = action('Edit', () => editMember(member,group));
    const remove = action('Delete', () => {
      state.members = state.members.filter(item => item.id !== member.id);
      refresh('Member removed.');
      get('name').focus();
    });
    edit.setAttribute('aria-label','Edit member '+(index+1)+': '+member.name);
    remove.setAttribute('aria-label','Delete member '+(index+1)+': '+member.name);
    group.append(name,edit,remove);
    row.append(group);
    return [row];
  });
  get('members').replaceChildren(...rows);
  get('member-count').textContent = '(' + state.members.length + ')';
  get('empty').textContent = rows.length ? '' : state.members.length ? 'No names match your search.' : 'Your group is empty. Add a name to get started.';
  get('shuffle').disabled = state.members.length < 2;
  get('clear').disabled = !state.members.length;
  const ready = active.length > 0;
  get('spin').disabled = get('hub').disabled = !ready || spinning;
  get('roster-controls').disabled = get('mode').disabled = get('reset-winners').disabled = get('reset-wheel').disabled = spinning;
  get('status').textContent = ready ? active.length + ' eligible ' + (active.length === 1 ? 'member' : 'members') :
    state.members.length ? 'Everyone has been picked. Choose Reset Winners to start again.' : 'Add group members to spin.';
  get('total').textContent = '· ' + state.history.length + ' total spins';
  get('history').replaceChildren(...state.history.map(entry => make('li',entry.name)));
  if (!state.history.length) get('history').append(make('li','No spins yet.'));
  if (!keepWheel) draw(active,rotation);
}

function refresh(message) {
  rotation = 0;
  save();
  render();
  if (message) toast(message);
}

function editMember(member, group) {
  const input = make('input','');
  input.value = member.name;
  input.maxLength = 120;
  input.setAttribute('aria-label','Edit member name');
  function apply() {
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    member.name = name;
    refresh('Name updated.');
    get('name').focus();
  }
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); apply(); }
    if (event.key === 'Escape') { render(); get('name').focus(); }
  });
  group.replaceChildren(input,action('Save',apply),action('Cancel',() => { render(); get('name').focus(); }));
  input.select();
}

function addNames(values) {
  const names = values.map(name => name.trim().slice(0,120)).filter(Boolean);
  const accepted = names.slice(0,limit - state.members.length);
  const colors = [...palette.keys()];
  accepted.forEach(name => {
    const available = colors.filter(color => color !== state.members.at(-1)?.color);
    state.members.push({id:nextId++, name, color:available[randomIndex(available.length)]});
  });
  if (accepted.length) refresh(accepted.length + (accepted.length === 1 ? ' member added.' : ' members added.'));
  if (names.length > accepted.length) toast('The wheel supports up to ' + limit + ' members.');
}

function playTone(frequency, when, duration) {
  if (!audio || audio.state !== 'running' || state.muted) return;
  const tone = audio.createOscillator();
  const volume = audio.createGain();
  tone.frequency.value = frequency;
  volume.gain.setValueAtTime(0.08,when);
  volume.gain.exponentialRampToValueAtTime(0.001,when + duration);
  tone.connect(volume).connect(audio.destination);
  tone.start(when);
  tone.stop(when + duration);
}

function prepareAudio() {
  if (state.muted) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audio ??= new AudioContext();
    audio.resume().catch(() => {});
  } catch {}
}

function finish(selected, end) {
  rotation = end % 360;
  spinning = false;
  winner = selected;
  state.history.push({id:selected.id,name:selected.name});
  save();
  const group = eligible();
  get('status').textContent = selected.name + ' was selected.';
  get('winner-name').textContent = selected.name;
  get('again').disabled = !group.length;
  get('remove-winner').disabled = !state.members.some(member => member.id === selected.id);
  get('roster-controls').disabled = get('mode').disabled = get('reset-winners').disabled = get('reset-wheel').disabled = false;
  get('total').textContent = '· ' + state.history.length + ' total spins';
  if (!group.length) get('status').textContent += ' Everyone has been picked. Choose Reset Winners to start again.';
  if (audio) [523,659,784].forEach((note,i) => playTone(note,audio.currentTime + i * .095,.2));
  modal.showModal();
  window.QBCorrectConfetti?.play(modal);
}

function spin() {
  if (spinning || modal.open) return;
  const group = eligible();
  if (!group.length) return;
  prepareAudio();
  const index = randomIndex(group.length);
  const startAngle = rotation;
  const endAngle = targetRotation(startAngle,index,group.length);
  spinning = true;
  render();
  get('status').textContent = 'Spinning…';
  const duration = reduced.matches ? 0 : 5700;
  if (!duration) { draw(group,endAngle); finish(group[index],endAngle); return; }
  const started = performance.now();
  let previousStep = -1;
  function frame(now) {
    const progress = Math.min(1,(now-started)/duration);
    const eased = 1 - (1-progress) ** 3;
    rotation = startAngle + (endAngle-startAngle) * eased;
    draw(group,rotation);
    const step = Math.floor(rotation / Math.max(28,360/group.length));
    if (step !== previousStep && audio) playTone(210,audio.currentTime,.045);
    previousStep = step;
    if (progress < 1) requestAnimationFrame(frame);
    else finish(group[index],endAngle);
  }
  requestAnimationFrame(frame);
}

get('add').addEventListener('submit',event => { event.preventDefault(); addNames([get('name').value]); get('name').value=''; get('name').focus(); });
get('bulk').addEventListener('submit',event => { event.preventDefault(); addNames(get('names').value.split(/\r?\n/)); get('names').value=''; });
get('search').addEventListener('input',() => render({keepWheel:true}));
get('shuffle').onclick = () => {
  for (let i=state.members.length-1;i>0;i--) {
    const j=randomIndex(i+1);
    [state.members[i],state.members[j]]=[state.members[j],state.members[i]];
  }
  refresh('Member order shuffled.');
};
get('clear').onclick = () => { get('confirm').returnValue=''; get('confirm').showModal(); };
get('confirm').addEventListener('close',() => {
  if (get('confirm').returnValue !== 'clear') return;
  state.members=[]; state.history=[]; refresh('Group cleared.'); get('name').focus();
});
get('mode').value=state.mode;
get('mode').onchange = () => { state.mode=get('mode').value; refresh('Winner selection updated.'); };
get('reset-winners').onclick = () => { state.history=[]; refresh('Winner history cleared.'); };
get('reset-wheel').onclick = () => { refresh('Wheel returned to its starting position.'); };
function syncSound() {
  get('sound').textContent = state.muted ? 'Sound off' : 'Sound on';
  get('sound').setAttribute('aria-pressed',String(!state.muted));
}
get('sound').onclick = () => {
  state.muted=!state.muted;
  if (state.muted) audio?.suspend().catch(() => {});
  else prepareAudio();
  syncSound(); save();
};
get('spin').onclick=get('hub').onclick=spin;
get('again').onclick = () => { modal.close(); spin(); };
get('remove-winner').onclick = () => {
  state.members=state.members.filter(member => member.id !== winner.id);
  modal.close();
  refresh('Winner removed from the group.');
};
modal.addEventListener('close',() => {
  window.QBCorrectConfetti?.clear();
  if (spinning) return;
  render({keepWheel:true});
  (get('spin').disabled ? get('reset-winners') : get('spin')).focus();
});
const set = new URLSearchParams(location.search).get('questionSet');
if (set) get('back').search = new URLSearchParams({questionSet:set}).toString();
syncSound();
render();
