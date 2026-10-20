const COLS = 10, ROWS = 8;
const initialCrew = [
  { id: "hacker", name: "Hex", role: "Hacker", emoji: "🧑‍💻", color: "#7db7ff", ability: "Hack door", desc: "Hack a security door from an adjacent tile." },
  { id: "distractor", name: "Misdirect", role: "Distractor", emoji: "🦝", color: "#ff8a54", ability: "Throw decoy", desc: "Lure the nearest guard toward a decoy." },
  { id: "pickpocket", name: "Swipe", role: "Pickpocket", emoji: "🥷", color: "#ff79b9", ability: "Steal key", desc: "Pick up the vault key when standing next to it." }
];

const walls = [
  "##########",
  "#........#",
  "#.##.....#",
  "#....##..#",
  "#........#",
  "#..##....#",
  "#........#",
  "##########"
];

let state;
const $ = (id) => document.getElementById(id);
const key = (x,y) => `${x},${y}`;
const same = (a,b) => a.x === b.x && a.y === b.y;
const manhattan = (a,b) => Math.abs(a.x-b.x)+Math.abs(a.y-b.y);

function resetGame() {
  state = {
    turn: 0, selected: "hacker", keyTaken: false, doorOpen: false, won: false, lost: false,
    keyPos: {x:7,y:2}, doorPos: {x:7,y:3}, vaultPos: {x:8,y:5}, exitPos: {x:1,y:6},
    crew: [
      {...initialCrew[0], x:1,y:1},
      {...initialCrew[1], x:2,y:1},
      {...initialCrew[2], x:1,y:2}
    ],
    guards: [{id:1,x:6,y:4,home:{x:6,y:4},decoy:null},{id:2,x:8,y:2,home:{x:8,y:2},decoy:null}],
    logs: ["🧠 The brain cell has entered the building.", "🎯 Objective: steal the key, hack the door, reach the vault."]
  };
  render();
}

function activeCrew() { return state.crew.find(c => c.id === state.selected); }
function blocked(x,y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
  if (walls[y][x] === "#") return true;
  if (!state.doorOpen && same({x,y}, state.doorPos)) return true;
  return false;
}
function occupiedByCrew(x,y, exceptId) {
  return state.crew.some(c => c.id !== exceptId && c.x === x && c.y === y);
}
function guardAt(x,y) { return state.guards.some(g => g.x===x && g.y===y); }
function addLog(message) {
  state.logs.unshift(message);
  state.logs = state.logs.slice(0,5);
}
function endCheck() {
  const caught = state.crew.some(c => guardAt(c.x,c.y));
  if (caught && !state.won) {
    state.lost = true;
    addLog("🚨 BUSTED. The guards caught a thief. The brain cell has been confiscated.");
  }
  if (state.keyTaken && state.doorOpen && state.crew.some(c => same(c,state.vaultPos))) {
    state.won = true;
    addLog("💰 THE VAULT IS YOURS. Somehow, the plan worked.");
  }
}
function guardTurn() {
  state.guards.forEach(g => {
    let target;
    if (g.decoy) {
      target = g.decoy;
      if (same(g,target)) { g.decoy = null; target = null; }
    }
    if (!target) {
      const visible = state.crew.filter(c => manhattan(c,g) <= 4).sort((a,b)=>manhattan(a,g)-manhattan(b,g));
      if (visible.length) target = visible[0];
    }
    if (!target) target = g.home;
    const dx = Math.sign(target.x-g.x), dy = Math.sign(target.y-g.y);
    const options = [];
    if (dx) options.push({x:g.x+dx,y:g.y});
    if (dy) options.push({x:g.x,y:g.y+dy});
    if (!dx && !dy) return;
    const next = options.find(p => !blocked(p.x,p.y) && !guardAt(p.x,p.y) && !occupiedByCrew(p.x,p.y,""));
    if (next) { g.x=next.x; g.y=next.y; }
  });
  endCheck();
}
function spendTurn(message, advanceGuards=true) {
  state.turn++;
  addLog(message);
  if (advanceGuards) guardTurn();
  render();
}
function moveCrew(x,y) {
  if (state.won || state.lost) return;
  const c = activeCrew();
  if (!c || blocked(x,y) || occupiedByCrew(x,y,c.id) || guardAt(x,y)) return;
  if (manhattan(c,{x,y}) !== 1) {
    addLog("🧠 One tile at a time. This is a heist, not teleportation.");
    render(); return;
  }
  c.x=x; c.y=y;
  let msg = `${c.emoji} ${c.name} moved. The brain cell is sweating.`;
  if (!state.keyTaken && same(c,state.keyPos)) {
    if (c.id === "pickpocket") { state.keyTaken=true; msg=`🗝️ Swipe grabbed the key. A rare moment of competence.`; }
    else { msg="🗝️ There's a key here. Swipe is the only one qualified to steal it."; }
  }
  spendTurn(msg);
}
function useAbility() {
  if (state.won || state.lost) return;
  const c = activeCrew();
  if (!c) return;
  if (c.id === "hacker") {
    if (state.doorOpen) { addLog("💻 The door is already hacked. Hex is taking credit anyway."); render(); return; }
    if (manhattan(c,state.doorPos) > 1) { addLog("💻 Get next to the security door first."); render(); return; }
    state.doorOpen=true;
    spendTurn("💻 Hex hacked the door. Cybersecurity has left the chat.");
  } else if (c.id === "distractor") {
    const guard = [...state.guards].sort((a,b)=>manhattan(c,a)-manhattan(c,b))[0];
    guard.decoy = {x: Math.max(1,Math.min(COLS-2,c.x+(c.x<=5?2:-2))), y:c.y};
    spendTurn("🪙 Misdirect tossed a decoy. The guard has the attention span of a spoon.");
  } else if (c.id === "pickpocket") {
    if (state.keyTaken) { addLog("🥷 Swipe already has the key. Stop stealing from the team."); render(); return; }
    if (manhattan(c,state.keyPos) > 1) { addLog("🥷 Get next to the key first."); render(); return; }
    state.keyTaken=true;
    spendTurn("🗝️ Swipe stole the key. This is literally the one thing they are good at.");
  }
}
function renderBoard() {
  const board=$("board"); board.innerHTML="";
  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) {
    const tile=document.createElement("button");
    tile.className="tile"; tile.setAttribute("role","gridcell");
    const isWall=walls[y][x]==="#";
    const isDoor=same({x,y},state.doorPos);
    const isVault=same({x,y},state.vaultPos);
    const isExit=same({x,y},state.exitPos);
    if(isWall) tile.classList.add("wall");
    else if(isDoor&&!state.doorOpen) tile.classList.add("door");
    else if(isVault) tile.classList.add("vault");
    else if(isExit) tile.classList.add("exit");
    else tile.classList.add("floor");
    const c=state.crew.find(c=>c.x===x&&c.y===y);
    const g=state.guards.find(g=>g.x===x&&g.y===y);
    if(g) { tile.classList.add("guard-tile"); tile.innerHTML=`<span class="occupant">👮</span>`; }
    else if(c) { tile.innerHTML=`<span class="occupant">${c.emoji}</span>`; if(c.id===state.selected) tile.classList.add("selected-tile"); }
    else if(!state.keyTaken&&same({x,y},state.keyPos)) { tile.classList.add("key"); tile.textContent="🗝️"; }
    else if(isDoor&&!state.doorOpen) tile.textContent="🔒";
    else if(isVault) tile.textContent="💰";
    else if(isExit) tile.textContent="🚪";
    if(!isWall && !g && !c && manhattan(activeCrew()||{x:-5,y:-5},{x,y})===1) tile.classList.add("reachable");
    tile.title = `${x}, ${y}`;
    tile.addEventListener("click",()=>moveCrew(x,y));
    board.appendChild(tile);
  }
}
function renderCrew() {
  const box=$("crewCards"); box.innerHTML="";
  state.crew.forEach(c=>{
    const btn=document.createElement("button");
    btn.className="crew-card"+(c.id===state.selected?" active":"");
    btn.innerHTML=`<span class="crew-avatar">${c.emoji}</span><span class="crew-copy"><strong>${c.name}</strong><span>${c.role}</span></span><span class="crew-tag">${c.id===state.selected?"SELECTED":"SELECT"}</span>`;
    btn.addEventListener("click",()=>{state.selected=c.id;render();});
    box.appendChild(btn);
  });
}
function render() {
  renderBoard(); renderCrew();
  $("turnCount").textContent=state.turn;
  $("logMessages").innerHTML=state.logs.map(x=>`<p>${escapeHtml(x)}</p>`).join("");
  const c=activeCrew();
  $("actionTitle").textContent=c?`${c.emoji} ${c.ability}`:"Select a thief";
  $("actionDescription").textContent=c?c.desc:"Choose a crew member.";
  const btn=$("abilityBtn"); btn.disabled=!c||state.won||state.lost; btn.textContent=c?c.ability:"Use ability";
  btn.onclick=useAbility;
  $("brainMeter").style.width=state.won?"100%":state.lost?"0%":"100%";
  $("brainStatus").textContent=state.won?"One brain cell. One successful crime.":state.lost?"Brain cell seized by authorities.":`Currently processing one (1) thought. ${c?c.name+" has control.":""}`;
  $("missionStatus").textContent=state.won?"MISSION COMPLETE: YOU GOT THE LOOT":state.lost?"MISSION FAILED: ABSOLUTE CLOWNERY":"MISSION: GET THE LOOT";
  if(state.won||state.lost) showModal(state.won);
}
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}
function showModal(won) {
  if(document.getElementById("endModal")) return;
  const backdrop=document.createElement("div"); backdrop.className="modal-backdrop";backdrop.id="endModal";
  backdrop.innerHTML=`<div class="modal"><div class="big">${won?"💰":"🚨"}</div><p class="eyebrow">${won?"UNBELIEVABLE SUCCESS":"HEIST DISASTER"}</p><h2>${won?"The loot is yours.":"The crew got caught."}</h2><p>${won?"Against all odds, the shared brain cell delivered. The crew will absolutely take credit.":"The guards have arrested the team and confiscated the one brain cell. Maybe try thinking this time."}</p><button class="button button-primary" id="modalRestart">Try again</button></div>`;
  document.body.appendChild(backdrop);
  document.getElementById("modalRestart").addEventListener("click",resetGame);
}
$("restartBtn").addEventListener("click",resetGame);
resetGame();
