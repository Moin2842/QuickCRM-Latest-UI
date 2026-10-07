/* =========================================================
   QuickCRM 2026 landing page interactions
   ========================================================= */
document.documentElement.classList.add("js");
/* ?static renders the final state with no motion, used for exporting screenshots */
if (new URLSearchParams(location.search).has("static")) document.documentElement.classList.add("static");

(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmt = (n) => "$" + Math.round(n).toLocaleString("en-US");

  /* ---------------- scroll driven UI (one rAF throttled listener) ---------------- */
  const scrollTasks = [];
  let ticking = false;
  const runScroll = () => { ticking = false; scrollTasks.forEach((fn) => fn()); };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(runScroll); } }, { passive: true });
  addEventListener("resize", runScroll);

  const navWrap = $(".nav-wrap");
  const bar = $(".scroll-progress span");
  const toTop = $("#toTop");
  scrollTasks.push(() => {
    const y = scrollY;
    navWrap.classList.toggle("scrolled", y > 40);
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    toTop.classList.toggle("show", y > innerHeight * 1.2);
  });
  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

  /* mobile menu */
  const burger = $(".burger");
  burger.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") !== "true";
    burger.setAttribute("aria-expanded", open);
    document.body.classList.toggle("menu-open", open);
  });
  $$(".mobile-menu a").forEach((a) => a.addEventListener("click", () => {
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }));

  /* active nav link */
  const navLinks = $$(".nav-links a");
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = "#" + e.target.id;
      navLinks.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["top", "features", "industries", "integrations", "reviews", "faq"].forEach((id) => { const el = document.getElementById(id); if (el) sectionIO.observe(el); });

  /* ---------------- reveal on scroll ---------------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
  $$("[data-reveal]").forEach((el) => revealIO.observe(el));

  /* ---------------- count up ---------------- */
  const countUp = (el) => {
    const end = parseFloat(el.dataset.count);
    const dec = +(el.dataset.dec || 0);
    const pre = el.dataset.prefix || "";
    const suf = el.dataset.suffix || "";
    const dur = 1600;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = pre + (end * e).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    if (reduce) el.textContent = pre + end.toFixed(dec) + suf;
    else requestAnimationFrame(step);
  };
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { countUp(e.target); countIO.unobserve(e.target); } });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((el) => countIO.observe(el));

  /* ---------------- hero title split + entrance ---------------- */
  const title = $("[data-split]");
  let wi = 0;
  const splitNode = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span");
          w.className = "w";
          w.innerHTML = `<span class="wi" style="--d:${(wi++ * 0.06).toFixed(2)}s">${part}</span>`;
          frag.appendChild(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) splitNode(child);
    });
  };
  splitNode(title);

  const hero = $(".hero");
  const device = $(".device");
  device.classList.add("pre");
  requestAnimationFrame(() => requestAnimationFrame(() => {
    title.classList.add("go");
    setTimeout(() => { device.classList.remove("pre"); hero.classList.add("ready"); }, 500);
  }));

  /* tilt + parallax (device stays flat while the cursor is on it, so dragging feels solid) */
  const floats = $$(".float");
  hero.addEventListener("mousemove", (e) => {
    if (reduce) return;
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    const onDevice = device.contains(e.target);
    device.style.setProperty("--ry", onDevice ? "0deg" : `${(x * 5).toFixed(2)}deg`);
    device.style.setProperty("--rx", onDevice ? "0deg" : `${(-y * 4).toFixed(2)}deg`);
    floats.forEach((f) => {
      const d = +f.dataset.depth;
      f.style.translate = `${(-x * d).toFixed(1)}px ${(-y * d).toFixed(1)}px`;
    });
  });
  hero.addEventListener("mouseleave", () => {
    device.style.setProperty("--rx", "0deg");
    device.style.setProperty("--ry", "0deg");
    floats.forEach((f) => (f.style.translate = "0 0"));
  });

  /* magnetic primary CTA */
  $$(".magnetic").forEach((b) => {
    b.addEventListener("mousemove", (e) => {
      const r = b.getBoundingClientRect();
      b.style.translate = `${((e.clientX - r.left - r.width / 2) * 0.15).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1)}px`;
    });
    b.addEventListener("mouseleave", () => (b.style.translate = "0 0"));
  });

  /* =========================================================
     INTERACTIVE DASHBOARD
     ========================================================= */
  const app = $(".app");
  const mainEl = $(".main");
  const viewTitle = $(".view-title");
  const viewSub = $(".view-sub");
  const sideBtns = $$(".side-nav button");
  const indicator = $(".side-indicator");
  const viewMeta = {
    overview: ["Hello, Ananya", "Here is how your sales are moving today"],
    pipeline: ["Sales pipeline", "Drag deals across stages and watch totals update"],
    leads: ["Leads", "Filter by tag or search to find anyone fast"],
    contacts: ["Sarah Whitmore", "Every call, note and detail in one profile"],
    reports: ["Reports", "Live numbers, no Monday spreadsheet hunt"],
    automation: ["Automation", "Follow ups and research that run on their own"],
  };

  const moveIndicator = (btn) => { indicator.style.transform = `translateY(${btn.offsetTop}px)`; indicator.style.height = btn.offsetHeight + "px"; };
  const showView = (name) => {
    const btn = sideBtns.find((b) => b.dataset.view === name);
    sideBtns.forEach((b) => b.classList.toggle("on", b === btn));
    moveIndicator(btn);
    $$(".view").forEach((v) => v.classList.toggle("on", v.dataset.view === name));
    mainEl.classList.add("swap");
    setTimeout(() => {
      [viewTitle.textContent, viewSub.textContent] = viewMeta[name];
      mainEl.classList.remove("swap");
    }, 200);
    if (name === "reports") renderBars();
  };
  sideBtns.forEach((b) => b.addEventListener("click", () => showView(b.dataset.view)));
  /* deep link into a demo screen, e.g. ?view=pipeline */
  const startView = new URLSearchParams(location.search).get("view");
  requestAnimationFrame(() => (viewMeta[startView] ? showView(startView) : moveIndicator(sideBtns[0])));

  /* in app toast */
  const toast = $("#appToast");
  const bell = $(".bell");
  const bellCount = $(".bell-count");
  let toastTimer;
  const showToast = (icon, head, text) => {
    toast.innerHTML = `<i class="ph-fill ${icon}"></i><div><b>${head}</b>${text}</div>`;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
  };
  const bumpBell = () => {
    bellCount.textContent = +bellCount.textContent + 1;
    bell.classList.remove("ring"); void bell.offsetWidth; bell.classList.add("ring");
  };

  /* ---------- overview: revenue chart ---------- */
  const chartData = {
    7: { v: [5200, 6100, 5600, 7900, 6800, 8400, 8920], l: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], total: "$48,920", delta: "+14.2% vs previous week" },
    30: { v: [21800, 24300, 22100, 27900, 26400, 30200, 33640], l: ["Sep 7", "Sep 11", "Sep 15", "Sep 19", "Sep 23", "Sep 27", "Oct 1"], total: "$186,340", delta: "+9.8% vs previous 30 days" },
    90: { v: [52300, 61700, 58800, 70400, 79600, 88300, 101670], l: ["Jul 7", "Jul 21", "Aug 4", "Aug 18", "Sep 1", "Sep 15", "Sep 29"], total: "$512,770", delta: "+21.3% vs last quarter" },
  };
  const chart = $("#revChart");
  const lineP = $(".line", chart);
  const areaP = $(".area", chart);
  const cursor = $(".chart-cursor", chart);
  const dot = $(".chart-dot", chart);
  const tip = $(".chart-tip", chart);
  const xAxis = $(".chart-x", chart);
  let curRange = 7;
  const pts = (vals) => {
    const max = Math.max(...vals) * 1.12, min = Math.min(...vals) * 0.8;
    return vals.map((v, i) => [(i / (vals.length - 1)) * 400, 130 - ((v - min) / (max - min)) * 115]);
  };
  const smooth = (p) => {
    let d = `M ${p[0][0]} ${p[0][1]}`;
    for (let i = 0; i < p.length - 1; i++) {
      const [x0, y0] = p[i - 1] || p[i], [x1, y1] = p[i], [x2, y2] = p[i + 1], [x3, y3] = p[i + 2] || p[i + 1];
      d += ` C ${(x1 + (x2 - x0) / 6).toFixed(1)} ${(y1 + (y2 - y0) / 6).toFixed(1)}, ${(x2 - (x3 - x1) / 6).toFixed(1)} ${(y2 - (y3 - y1) / 6).toFixed(1)}, ${x2} ${y2}`;
    }
    return d;
  };
  const drawChart = (range) => {
    curRange = range;
    const d = chartData[range];
    const p = pts(d.v);
    const line = smooth(p);
    lineP.setAttribute("d", line);
    areaP.setAttribute("d", `${line} L 400 140 L 0 140 Z`);
    lineP.style.d = `path("${line}")`;
    areaP.style.d = `path("${line} L 400 140 L 0 140 Z")`;
    xAxis.innerHTML = d.l.map((l) => `<span>${l}</span>`).join("");
    $("#chartTotal").textContent = d.total;
    $("#chartDelta").textContent = d.delta;
  };
  drawChart(7);
  chart.addEventListener("mousemove", (e) => {
    const r = chart.getBoundingClientRect();
    const d = chartData[curRange];
    const i = Math.round(((e.clientX - r.left) / r.width) * (d.v.length - 1));
    const idx = Math.max(0, Math.min(d.v.length - 1, i));
    const p = pts(d.v)[idx];
    const h = r.height - 24;
    cursor.style.left = (p[0] / 400) * r.width + "px";
    dot.style.top = (p[1] / 140) * h - 5 + "px";
    tip.style.top = (p[1] / 140) * h + "px";
    tip.textContent = `${d.l[idx]} · ${fmt(d.v[idx])}`;
    tip.style.left = idx > d.v.length - 3 ? "auto" : "8px";
    tip.style.right = idx > d.v.length - 3 ? "8px" : "auto";
  });

  /* segmented controls */
  $$(".seg").forEach((seg) => seg.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    $$("button", seg).forEach((x) => x.classList.toggle("on", x === b));
    const kind = seg.dataset.seg;
    if (kind === "chart") drawChart(+b.dataset.range);
    if (kind === "pipe") setPipeMode(b.dataset.mode);
    if (kind === "reps") { repPeriod = b.dataset.p; renderBars(); }
  }));

  /* to do list */
  const todoLeft = $("#todoLeft");
  $("#todo").addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    li.classList.toggle("done");
    const left = $$("#todo li:not(.done)").length;
    todoLeft.textContent = left ? `${left} left` : "All done";
    todoLeft.className = "badge " + (left ? "b-amber" : "b-green");
    if (li.classList.contains("done")) showToast("ph-check-circle", "Follow up completed", li.querySelector("b").textContent);
  });

  /* ---------- pipeline: drag and drop kanban ---------- */
  const deals = [
    { id: 1, n: "Arjun Mehta", c: "Orbit Retail", v: 8500, s: "New", av: "#F97316" },
    { id: 2, n: "Sneha Rao", c: "Vantage Labs", v: 4200, s: "New", av: "#0EA5E9" },
    { id: 3, n: "Vikram Das", c: "Northwind Co.", v: 12000, s: "Qualified", av: "#0EA5A4" },
    { id: 4, n: "Priya Nair", c: "Solace Health", v: 6800, s: "Proposal", av: "#DB2777" },
    { id: 5, n: "Rohan Iyer", c: "BrightPath", v: 15400, s: "Proposal", av: "#2563EB" },
    { id: 6, n: "Kavya Menon", c: "CloudNest", v: 9100, s: "Negotiation", av: "#D97706" },
    { id: 7, n: "Aditya Kulkarni", c: "Zenith Freight", v: 11300, s: "Won", av: "#16A34A" },
  ];
  const stageColor = { New: "#94A3B8", Qualified: "#2563EB", Proposal: "#0EA5E9", Negotiation: "#F59E0B", Won: "#16A34A" };
  const kanban = $("#kanban");
  const pipeList = $("#pipeList");
  const initials = (n) => n.split(" ").map((x) => x[0]).join("").slice(0, 2);
  const k = (v) => "$" + (v / 1000).toFixed(v % 1000 ? 1 : 0) + "K";
  let dragId = null;

  const renderKanban = (landed) => {
    $$(".col", kanban).forEach((col) => {
      const stage = col.dataset.stage;
      const list = deals.filter((d) => d.s === stage);
      $(".col-body", col).innerHTML = list.map((d) => `
        <div class="deal${d.id === landed ? " landed" : ""}" draggable="true" data-id="${d.id}">
          <b>${d.n}</b><span class="co">${d.c}</span>
          <div class="row"><span class="amt">${k(d.v)}</span><span class="av" style="--c:${d.av}">${initials(d.n)}</span></div>
        </div>`).join("");
      $(".n", col).textContent = list.length;
      $(".col-sum", col).textContent = k(list.reduce((a, d) => a + d.v, 0));
    });
    const open = deals.filter((d) => d.s !== "Won").reduce((a, d) => a + d.v, 0);
    $("#pipeTotal").textContent = fmt(open) + " open";
    pipeList.innerHTML = deals.map((d, i) => `
      <div class="pl-row" style="animation-delay:${i * 40}ms">
        <span class="who" style="display:flex;align-items:center;gap:8px"><span class="av" style="--c:${d.av};width:24px;height:24px;font-size:8px">${initials(d.n)}</span><b>${d.n}</b></span>
        <span class="muted">${d.c}</span>
        <span><span class="badge" style="background:${stageColor[d.s]}1f;color:${stageColor[d.s]}">${d.s}</span></span>
        <b>${fmt(d.v)}</b>
      </div>`).join("");
  };
  renderKanban();

  kanban.addEventListener("dragstart", (e) => {
    const card = e.target.closest(".deal");
    if (!card) return;
    dragId = +card.dataset.id;
    card.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", card.dataset.id);
    $(".drag-hint").classList.add("gone");
  });
  kanban.addEventListener("dragend", (e) => {
    e.target.closest(".deal")?.classList.remove("dragging");
    $$(".col", kanban).forEach((c) => c.classList.remove("over"));
  });
  kanban.addEventListener("dragover", (e) => {
    const col = e.target.closest(".col");
    if (!col) return;
    e.preventDefault();
    $$(".col", kanban).forEach((c) => c.classList.toggle("over", c === col));
  });
  kanban.addEventListener("drop", (e) => {
    const col = e.target.closest(".col");
    if (!col || dragId == null) return;
    e.preventDefault();
    const d = deals.find((x) => x.id === dragId);
    const from = d.s;
    d.s = col.dataset.stage;
    dragId = null;
    renderKanban(d.id);
    if (from === d.s) return;
    if (d.s === "Won") {
      showToast("ph-trophy", `Deal won · ${fmt(d.v)}`, `${d.c} moved to Won`);
      const won = $("#kpiWon");
      won.textContent = +won.textContent + 1;
      won.classList.remove("bump"); void won.offsetWidth; won.classList.add("bump");
    } else showToast("ph-kanban", "Deal moved", `${d.c}: ${from} to ${d.s}`);
  });
  /* click fallback for touch: tap a card to advance it one stage */
  const stages = Object.keys(stageColor);
  kanban.addEventListener("click", (e) => {
    const card = e.target.closest(".deal");
    if (!card || !matchMedia("(pointer: coarse)").matches) return;
    const d = deals.find((x) => x.id === +card.dataset.id);
    const i = stages.indexOf(d.s);
    if (i < stages.length - 1) { d.s = stages[i + 1]; renderKanban(d.id); showToast("ph-kanban", "Deal moved", `${d.c} to ${d.s}`); }
  });
  const setPipeMode = (mode) => {
    kanban.hidden = mode === "list";
    pipeList.hidden = mode !== "list";
    $(".drag-hint").classList.toggle("gone", mode === "list");
    if (mode === "list") renderKanban();
  };

  /* ---------- leads: filters, search, add ---------- */
  const leads = [
    { n: "Arjun Mehta", c: "Orbit Retail", t: ["Calling Data"], s: "Website", o: "Ananya B.", v: 8500, av: "#F97316" },
    { n: "Priya Nair", c: "Solace Health", t: ["Hot Lead", "Follow Up"], s: "Referral", o: "Rahul S.", v: 6800, av: "#DB2777" },
    { n: "Karan Mehta", c: "Silverline Tech", t: ["Inbound"], s: "Website", o: "Neha K.", v: 14200, av: "#0EA5A4" },
    { n: "Ananya Bose", c: "Everest Foods", t: ["Proposal Sent"], s: "Cold outreach", o: "Ananya B.", v: 5300, av: "#2563EB" },
    { n: "Vikram Das", c: "Northwind Co.", t: ["Hot Lead"], s: "Referral", o: "Karan P.", v: 12000, av: "#0EA5E9" },
    { n: "Sneha Rao", c: "Vantage Labs", t: ["Follow Up"], s: "Website", o: "Rahul S.", v: 4200, av: "#D97706" },
    { n: "Kavya Menon", c: "CloudNest", t: ["Proposal Sent", "Hot Lead"], s: "Website", o: "Neha K.", v: 9100, av: "#16A34A" },
    { n: "Rohan Iyer", c: "BrightPath", t: ["Inbound", "Calling Data"], s: "Cold outreach", o: "Karan P.", v: 15400, av: "#1D4ED8" },
  ];
  const leadPool = [
    { n: "Meera Joshi", c: "Lotus Interiors", t: ["Inbound", "Hot Lead"], s: "Website", o: "Ananya B.", v: 7400, av: "#E11D48" },
    { n: "Daniel Park", c: "Harbor Logistics", t: ["Calling Data"], s: "Cold outreach", o: "Rahul S.", v: 18900, av: "#0EA5A4" },
    { n: "Fatima Shaikh", c: "Crescent Clinics", t: ["Follow Up"], s: "Referral", o: "Neha K.", v: 6250, av: "#F97316" },
    { n: "Leo Martins", c: "Brightway Tours", t: ["Inbound"], s: "Website", o: "Karan P.", v: 3900, av: "#2563EB" },
  ];
  const tagClass = { "Hot Lead": "b-rose", "Follow Up": "b-amber", Inbound: "b-green", "Calling Data": "b-blue", "Proposal Sent": "b-teal" };
  let leadTag = "All", leadQuery = "", freshLead = null;
  const leadRows = $("#leadRows");
  const leadEmpty = $("#leadEmpty");
  const renderLeads = () => {
    const q = leadQuery.toLowerCase();
    const list = leads.filter((l) => (leadTag === "All" || l.t.includes(leadTag)) && (!q || (l.n + " " + l.c).toLowerCase().includes(q)));
    leadRows.innerHTML = list.map((l, i) => `
      <div class="tr lead-row${l === freshLead ? " new" : ""}" style="animation-delay:${i * 35}ms">
        <span class="who"><span class="av" style="--c:${l.av};width:28px;height:28px;font-size:10px">${initials(l.n)}</span><span><b>${l.n}</b><span>${l.c}</span></span></span>
        <span class="tags">${l.t.map((t) => `<span class="badge ${tagClass[t]}">${t}</span>`).join("")}</span>
        <span>${l.s}</span><span>${l.o}</span><span class="val">${k(l.v)}</span>
      </div>`).join("");
    leadEmpty.hidden = list.length > 0;
  };
  renderLeads();
  $("#leadChips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    leadTag = b.dataset.tag;
    $$(".chip", e.currentTarget).forEach((c) => c.classList.toggle("on", c === b));
    renderLeads();
  });
  $("#addLead").addEventListener("click", () => {
    const l = leadPool.shift();
    if (!l) { showToast("ph-info", "Demo limit reached", "Start a free trial to add unlimited leads"); return; }
    leads.unshift(l);
    freshLead = l;
    leadTag = "All";
    $$("#leadChips .chip").forEach((c) => c.classList.toggle("on", c.dataset.tag === "All"));
    renderLeads();
    showToast("ph-user-plus", "Lead added and assigned", `${l.n} · ${l.c} to ${l.o}`);
    bumpBell();
  });
  $("#globalSearch").addEventListener("input", (e) => {
    leadQuery = e.target.value.trim();
    if (!$('.view[data-view="leads"]').classList.contains("on")) showView("leads");
    renderLeads();
  });

  /* ---------- contacts: log activity ---------- */
  const timeline = $("#timeline");
  const logs = {
    call: ["ph-phone-outgoing c-blue", "Call · 8 min", "Confirmed seat count, sending final quote today."],
    note: ["ph-note-pencil c-amber", "Note", "Legal review starts next week. Follow up Thursday."],
  };
  $$("[data-log]").forEach((b) => b.addEventListener("click", () => {
    const [ic, head, text] = logs[b.dataset.log];
    const li = document.createElement("li");
    li.className = "fresh";
    li.innerHTML = `<i class="ph-fill ${ic}"></i><div><b>${head}</b><span>${text}</span></div><time>Just now</time>`;
    timeline.prepend(li);
    timeline.scrollTop = 0;
    showToast(b.dataset.log === "call" ? "ph-phone-outgoing" : "ph-note-pencil", b.dataset.log === "call" ? "Call logged" : "Note saved", "Added to Sarah Whitmore's timeline");
  }));

  /* ---------- reports ---------- */
  const reps = ["Ananya", "Rahul", "Neha", "Karan", "Vikram"];
  const repData = { week: [9, 7, 11, 5, 6], month: [34, 29, 41, 22, 26], quarter: [96, 88, 121, 64, 79] };
  let repPeriod = "week";
  const repBars = $("#repBars");
  repBars.innerHTML = reps.map((r) => `<div class="bar-col"><span class="bv">0</span><span class="bt"></span><span class="bn">${r}</span></div>`).join("");
  const renderBars = () => {
    const vals = repData[repPeriod];
    const max = Math.max(...vals);
    $$(".bar-col", repBars).forEach((c, i) => {
      c.classList.toggle("top", vals[i] === max);
      $(".bt", c).style.setProperty("--h", (vals[i] / max) * 78 + "%");
      $(".bv", c).textContent = vals[i];
    });
  };

  /* ---------- automation ---------- */
  $$(".switch").forEach((s) => {
    s.closest("li").classList.toggle("active", s.classList.contains("on"));
    s.addEventListener("click", () => {
      const on = !s.classList.contains("on");
      s.classList.toggle("on", on);
      s.setAttribute("aria-pressed", on);
      s.closest("li").classList.toggle("active", on);
      showToast(on ? "ph-lightning" : "ph-pause-circle", on ? "Automation on" : "Automation paused", s.closest("li").querySelector("b").textContent);
    });
  });
  const cd = $("#countdown");
  const tickCountdown = () => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(8, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const s = Math.floor((next - now) / 1000);
    cd.textContent = `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m ${String(s % 60).padStart(2, "0")}s`;
  };
  tickCountdown();
  setInterval(tickCountdown, 1000);

  const enrichOut = $("#enrichOut");
  $("#enrichBtn").addEventListener("click", (e) => {
    const b = e.currentTarget;
    b.disabled = true;
    b.textContent = "Reading site";
    enrichOut.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div>';
    setTimeout(() => {
      const items = [
        ["ph-chat-text c-blue", "Talking point", "Hiring 14 sales roles across Pune and Bengaluru"],
        ["ph-trend-up c-green", "Buying signal", "Raised a Series B in August, expanding the sales team"],
        ["ph-magnifying-glass c-amber", "Buying signal", "Comparing CRM tools on review sites this month"],
        ["ph-hand-waving c-teal", "Recommended opener", "Congratulate them on the new Pune office launch"],
      ];
      enrichOut.innerHTML = items.map(([ic, h, t], i) => `<div class="ins" style="animation-delay:${i * 90}ms"><i class="ph-fill ${ic}"></i><div><b>${h}</b>${t}</div></div>`).join("");
      b.disabled = false;
      b.textContent = "Enrich again";
      showToast("ph-sparkle", "Profile enriched", "silverlinetech.io is ready for your call");
    }, 1400);
  });

  /* ambient toasts while the hero is on screen */
  const ambient = [
    ["ph-user-plus", "New lead from website", "Meera Joshi · Lotus Interiors"],
    ["ph-bell-ringing", "Follow up reminder", "Call Priya Nair at 10:30 AM"],
    ["ph-envelope-open", "Email opened", "Sarah Whitmore opened Quote v2"],
    ["ph-whatsapp-logo", "WhatsApp reply", "Sneha Rao: Can we talk at 4?"],
  ];
  let ambientI = 0, heroVisible = true;
  new IntersectionObserver(([e]) => (heroVisible = e.isIntersecting), { threshold: 0.3 }).observe(app);
  setInterval(() => {
    if (!heroVisible || document.hidden || app.matches(":hover")) return;
    const [i, h, t] = ambient[ambientI++ % ambient.length];
    showToast(i, h, t);
    bumpBell();
  }, 9000);

  /* =========================================================
     PAGE SECTIONS
     ========================================================= */

  /* bento cursor glow */
  $$(".b-card").forEach((c) => c.addEventListener("mousemove", (e) => {
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", e.clientX - r.left + "px");
    c.style.setProperty("--my", e.clientY - r.top + "px");
  }));

  /* notification stack cycle */
  const notifs = $$("#notifStack .notif");
  let nOrder = notifs.map((_, i) => i);
  const placeNotifs = () => nOrder.forEach((n, pos) => (notifs[n].dataset.pos = pos));
  placeNotifs();
  setInterval(() => { nOrder.push(nOrder.shift()); placeNotifs(); }, 2800);

  /* tag playground */
  const tagCounts = { "Hot Lead": 11, "Calling Data": 17, "Follow Up": 12, "Proposal Sent": 6, Inbound: 9 };
  const tagPlay = $("#tagPlay");
  const updateTagCount = () => {
    const on = $$(".badge.on", tagPlay).map((b) => b.textContent.trim());
    $("#tagCount").textContent = on.reduce((a, t) => a + tagCounts[t], 0);
  };
  tagPlay.addEventListener("click", (e) => {
    const b = e.target.closest(".badge");
    if (!b) return;
    b.classList.toggle("on");
    updateTagCount();
  });
  updateTagCount();

  /* step progress line */
  const stepTrack = $("#stepTrack");
  scrollTasks.push(() => {
    const r = stepTrack.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (innerHeight * 0.5)));
    stepTrack.style.setProperty("--p", p.toFixed(3));
  });

  /* tagline word by word reveal */
  const tagText = $("#tagText");
  const wrapWords = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(" "));
          else { const s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.appendChild(s); }
        });
        child.replaceWith(frag);
      } else wrapWords(child);
    });
  };
  wrapWords(tagText);
  const tagWords = $$(".w", tagText);
  scrollTasks.push(() => {
    const line = innerHeight * 0.68;
    tagWords.forEach((w) => w.classList.toggle("on", w.getBoundingClientRect().top < line));
  });

  /* ---------- revenue calculator ---------- */
  const rL = $("#rLeads"), rD = $("#rDeal"), rM = $("#rMiss"), rC = $("#rConv");
  const crBars = $("#crBars");
  crBars.innerHTML = Array.from({ length: 12 }, () => "<i></i>").join("");
  const paint = (input) => {
    const p = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.setProperty("--p", p + "%");
  };
  const animateText = (el, to, f) => {
    const from = +(el.dataset.v || 0);
    el.dataset.v = to;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 500);
      el.textContent = f(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const calc = () => {
    [rL, rD, rM, rC].forEach(paint);
    const L = +rL.value, D = +rD.value, M = rM.value / 100, C = rC.value / 100;
    $("#oLeads").textContent = L.toLocaleString("en-US");
    $("#oDeal").textContent = fmt(D);
    $("#oMiss").textContent = Math.round(M * 100) + "%";
    $("#oConv").textContent = rC.value + "%";
    const rescued = L * M * 0.6;
    const extraDeals = rescued * C;
    const month = extraDeals * D;
    animateText($("#calcYear"), month * 12, fmt);
    animateText($("#calcMonth"), month, fmt);
    animateText($("#calcDeals"), extraDeals, (v) => v.toFixed(1));
    animateText($("#calcLeads"), rescued, (v) => Math.round(v).toLocaleString("en-US"));
    $$("i", crBars).forEach((b, i) => b.style.setProperty("--h", ((i + 1) / 12) * 100 + "%"));
  };
  [rL, rD, rM, rC].forEach((r) => r.addEventListener("input", calc));
  calc();

  /* ---------- industries ---------- */
  const industries = [
    { n: "Real Estate", i: "ph-house-line", d: "Track buyer and renter enquiries from first contact to closed deal, and keep brokers accountable for every follow up.",
      f: [["ph-map-pin-area", "Site visit tracking", "Log site visits and follow up calls against each lead."], ["ph-user-check", "Broker accountability", "See which leads are assigned to which broker, and how quickly they follow up."], ["ph-signpost", "Source tracking", "Know whether a lead came from a property portal, referral or walk in."]],
      focus: ["Buyers", "Renters", "Site visits", "Brokers", "Property portals"], st: ["Enquiry", "Site visit", "Negotiation", "Booked"], cur: 1,
      cards: [["ph-buildings", "#2563EB", "3 BHK · Baner Heights", "Site visit Sat 11:00 AM · Neha Kapoor", "Site visit", "b-blue"], ["ph-house-line", "#16A34A", "Villa · Palm Grove", "Referral · Broker: Rahul Sethi", "Booked", "b-green"], ["ph-key", "#D97706", "2 BHK rental · Kharadi", "Property portal · Follow up overdue", "Overdue", "b-rose"]] },
    { n: "Education & Coaching", i: "ph-graduation-cap", d: "Manage admissions enquiries and counselor follow ups in one pipeline, from first call to enrolled student.",
      f: [["ph-path", "Admissions pipeline", "Move enquiries through stages from New to Enrolled."], ["ph-users-three", "Counselor assignment", "Route enquiries to the right counselor automatically."], ["ph-alarm", "Follow up reminders", "Never miss a callback before a batch starts."]],
      focus: ["Admissions", "Counselors", "Batches", "Parents", "Enrollment"], st: ["Enquiry", "Counselling", "Demo class", "Enrolled"], cur: 2,
      cards: [["ph-student", "#2563EB", "Aarav Shah · Data science batch", "Counselor Priya · Demo on Thursday", "Demo class", "b-blue"], ["ph-phone-call", "#D97706", "Isha Verma · MBA prep", "Parent callback at 6:30 PM", "Follow up", "b-amber"], ["ph-certificate", "#16A34A", "Kabir Rao · UX bootcamp", "Fee paid · Batch starts Oct 14", "Enrolled", "b-green"]] },
    { n: "Financial Services", i: "ph-bank", d: "Manage loan, insurance and investment enquiries with full call history and organized follow up on every lead.",
      f: [["ph-stack", "Product wise tracking", "Tag or separate pipelines for loans, insurance or investment products."], ["ph-phone-list", "Logged call history", "Every call is auto logged with timestamp and outcome."], ["ph-file-text", "Follow up discipline", "Reminders for document collection and renewal follow ups."]],
      focus: ["Loans", "Insurance", "Investments", "KYC", "Advisors"], st: ["Lead", "KYC", "Review", "Disbursed"], cur: 1,
      cards: [["ph-house", "#2563EB", "Home loan · $86,400", "Salary slips pending · Advisor Rohit", "KYC", "b-blue"], ["ph-shield-check", "#D97706", "Term insurance renewal", "Policy lapses in 9 days", "Renewal", "b-amber"], ["ph-chart-line-up", "#16A34A", "Monthly SIP · $450", "Mandate signed yesterday", "Active", "b-green"]] },
    { n: "Call Centers & BPO", i: "ph-headset", d: "Log every call automatically and track telecaller performance and lead outcomes across your team.",
      f: [["ph-phone-incoming", "Auto logged calls", "Every call, its duration and its outcome save without manual entry."], ["ph-chart-bar", "Telecaller performance", "Compare calls made and conversions per agent."], ["ph-users-four", "Bulk lead assignment", "Distribute leads across your calling team in seconds."]],
      focus: ["Agents", "Campaigns", "Call queues", "SLA tracking", "Clients"], st: ["Assigned", "Contacted", "Interested", "Converted"], cur: 1,
      cards: [["ph-headset", "#2563EB", "Agent Anita · 142 calls today", "18 conversions · 12.7% rate", "Top agent", "b-green"], ["ph-headset", "#0EA5A4", "Agent Vikas · 97 calls today", "11 conversions · 3 callbacks due", "On shift", "b-blue"], ["ph-megaphone", "#D97706", "Festive offers campaign", "2,400 leads assigned in bulk", "Live", "b-amber"]] },
    { n: "Manufacturing & B2B", i: "ph-factory", d: "Manage B2B enquiries, quotations and follow ups from first contact to purchase order, even across long sales cycles.",
      f: [["ph-clipboard-text", "RFQ tracking", "Move enquiries from New to Quotation to Won."], ["ph-calendar-dots", "Long sales cycle support", "Set follow up reminders across weeks or months."], ["ph-eye", "Team visibility", "See which enquiries each sales rep is handling."]],
      focus: ["Dealers", "Quotations", "Distributors", "Bulk orders", "Field sales"], st: ["Enquiry", "RFQ", "Quotation", "PO received"], cur: 2,
      cards: [["ph-gear-six", "#2563EB", "500 units · Steel valves", "Dealer: Mehta Traders · Quote sent", "Quotation", "b-blue"], ["ph-package", "#D97706", "Bulk order · Packaging film", "Follow up scheduled in 3 weeks", "Nurture", "b-amber"], ["ph-truck", "#16A34A", "Distributor onboarding · Gujarat", "Purchase order received", "Won", "b-green"]] },
    { n: "Tours & Travels", i: "ph-airplane-tilt", d: "Track enquiries from every channel and follow up fast, before your customer books with someone else.",
      f: [["ph-globe-hemisphere-east", "Multi channel enquiries", "Capture enquiries from your website, phone and walk ins."], ["ph-lightning", "Fast follow up", "Respond before customers book with a competitor."], ["ph-suitcase-rolling", "Package tracking", "See which tour packages get the most enquiries."]],
      focus: ["Packages", "Itineraries", "Travel agents", "Group bookings", "Seasonal demand"], st: ["Enquiry", "Itinerary", "Quote", "Booked"], cur: 1,
      cards: [["ph-island", "#2563EB", "Bali 6 nights · Family of 4", "Website enquiry · Itinerary sent", "Itinerary", "b-blue"], ["ph-mountains", "#D97706", "Kashmir group tour · 12 travellers", "Phone enquiry · Reply within 1 hour", "Hot", "b-rose"], ["ph-airplane-takeoff", "#16A34A", "Dubai long weekend", "Walk in · Deposit paid", "Booked", "b-green"]] },
    { n: "Recruitment & Staffing", i: "ph-briefcase", d: "Manage candidate pipelines and client mandates side by side, from first submission to placement.",
      f: [["ph-user-switch", "Candidate pipeline", "Move candidates through stages from Sourced to Placed."], ["ph-clipboard-text", "Mandate tracking", "Track open client mandates and which candidates are submitted against each."], ["ph-alarm", "Follow up reminders", "Never miss an interview follow up or client update."]],
      focus: ["Candidates", "Clients", "Job orders", "Placements", "Recruiters"], st: ["Sourced", "Submitted", "Interview", "Placed"], cur: 2,
      cards: [["ph-code", "#2563EB", "Senior Java developer", "Mandate: Finverse · 3 submitted", "Open", "b-blue"], ["ph-pen-nib", "#D97706", "Priya Menon · Product designer", "Client interview Friday 2:00 PM", "Interview", "b-amber"], ["ph-handshake", "#16A34A", "Rahul Das · Sales manager", "Offer accepted · Joins Nov 3", "Placed", "b-green"]] },
    { n: "Gyms & Fitness", i: "ph-barbell", d: "Track trial walk ins and membership enquiries so no lead goes cold before you follow up.",
      f: [["ph-person-simple-run", "Trial to member pipeline", "Move enquiries from Trial to Enrolled member."], ["ph-arrows-clockwise", "Renewal follow ups", "Get reminders before memberships lapse."], ["ph-signpost", "Source tracking", "See which walk ins, referrals or campaigns bring the most members."]],
      focus: ["Memberships", "Trainers", "Trials", "Renewals", "Walk ins"], st: ["Walk in", "Trial", "Offer", "Member"], cur: 1,
      cards: [["ph-person-simple-run", "#2563EB", "Neha Gupta · 3 day trial", "Trial ends tomorrow · Trainer Aman", "Trial", "b-blue"], ["ph-arrows-clockwise", "#D97706", "Arjun Patel · Annual plan", "Membership renews in 5 days", "Renewal", "b-amber"], ["ph-heart", "#16A34A", "Sana Khan · Referral", "Joined the premium plan", "Member", "b-green"]] },
    { n: "Automotive Showroom", i: "ph-car-profile", d: "Track test drive enquiries and finance approvals in one pipeline so no buyer is left waiting.",
      f: [["ph-steering-wheel", "Test drive tracking", "Log test drive requests and follow ups against each enquiry."], ["ph-currency-circle-dollar", "Finance status", "See where each buyer stands in loan or finance approval."], ["ph-users", "Multi rep visibility", "Know which sales rep is handling each enquiry."]],
      focus: ["Test drives", "Financing", "Trade ins", "Showroom visits", "Service leads"], st: ["Enquiry", "Test drive", "Finance", "Delivered"], cur: 1,
      cards: [["ph-steering-wheel", "#2563EB", "SUV test drive · Kunal Shah", "Saturday 10:30 AM · Rep: Imran", "Test drive", "b-blue"], ["ph-bank", "#D97706", "Sedan · Loan approval", "Finance partner review in progress", "Finance", "b-amber"], ["ph-arrows-left-right", "#16A34A", "Trade in · 2019 hatchback", "Valuation booked for Monday", "Trade in", "b-green"]] },
  ];
  const indTitles = ["CRM for real estate teams", "CRM for education and coaching", "CRM for financial services", "CRM for call centers and BPO", "CRM for manufacturing and B2B", "CRM for tours and travels", "CRM for recruitment and staffing", "CRM for gyms and fitness studios", "CRM for automotive showrooms"];
  const indStats = [
    [["128", "enquiries this week"], ["14", "site visits booked"], ["23.4%", "enquiry to booking"]],
    [["212", "admission enquiries"], ["36", "demo classes booked"], ["31.8%", "enquiry to enrolled"]],
    [["94", "product enquiries"], ["27", "documents pending"], ["18.6%", "lead to disbursal"]],
    [["3,860", "calls logged today"], ["412", "interested leads"], ["10.7%", "call to conversion"]],
    [["46", "open RFQs"], ["19", "quotations sent"], ["27.3%", "quote to PO"]],
    [["174", "trip enquiries"], ["52", "itineraries sent"], ["21.9%", "enquiry to booking"]],
    [["38", "open mandates"], ["117", "candidates submitted"], ["14.2%", "submit to placement"]],
    [["86", "trial walk ins"], ["24", "renewals due"], ["38.4%", "trial to member"]],
    [["63", "test drives booked"], ["17", "finance approvals"], ["26.1%", "drive to delivery"]],
  ];
  const indTabs = $("#indTabs");
  indTabs.innerHTML = '<span class="ind-tab-ind"></span>' + industries.map((x, i) =>
    `<button class="ind-tab" role="tab" aria-selected="${i === 0}" data-i="${i}"><i class="ph ${x.i}"></i>${x.n}<span class="idx">0${i + 1}</span></button>`).join("");
  const indInd = $(".ind-tab-ind", indTabs);
  const indBtns = $$(".ind-tab", indTabs);
  const indProg = $("#indProg");
  let indI = 0, indAuto = true, indStart = 0;
  const IND_MS = 7000;
  const placeIndInd = () => {
    const b = indBtns[indI];
    indInd.style.transform = `translateY(${b.offsetTop}px)`;
    indInd.style.height = b.offsetHeight + "px";
  };
  const renderInd = (i, animate = true) => {
    indI = i;
    const x = industries[i];
    indBtns.forEach((b, j) => b.setAttribute("aria-selected", j === i));
    placeIndInd();
    $("#indCount").textContent = `0${i + 1} / 09`;
    $("#indTitle").textContent = indTitles[i];
    $("#indDesc").textContent = x.d;
    $("#indFeats").innerHTML = x.f.map(([ic, t, d]) => `<div class="ind-feat"><span class="mini-ico"><i class="ph ${ic}"></i></span><div><b>${t}</b><p>${d}</p></div></div>`).join("");
    $("#indFocus").innerHTML = x.focus.map((f) => `<span>${f}</span>`).join("");
    $("#indCta").innerHTML = `Explore ${x.n} <i class="ph-bold ph-arrow-right"></i>`;
    $("#indIco").innerHTML = `<i class="ph ${x.i}"></i>`;
    $("#indBoard").textContent = `${x.n} pipeline`;
    $("#indStages").innerHTML = x.st.map((s, j) => `<span class="${j === x.cur ? "cur" : ""}" style="animation-delay:${j * 60}ms">${s}</span>`).join("");
    $("#indCards").innerHTML = x.cards.map(([ic, c, t, s, tag, cls], j) =>
      `<div class="iv-card" style="animation-delay:${120 + j * 90}ms"><span class="av" style="--c:${c}"><i class="ph-fill ${ic}" style="font-size:20px"></i></span><div><b>${t}</b>${s}</div><span class="r"><span class="badge ${cls}">${tag}</span></span></div>`).join("");
    const foot = indStats[i];
    $("#indFoot").innerHTML = foot.map(([v, l], j) => `<div style="animation-delay:${400 + j * 80}ms"><b>${v}</b><span>${l}</span></div>`).join("");
    if (animate) {
      const copy = $(".ind-copy");
      copy.classList.remove("ind-swap"); void copy.offsetWidth; copy.classList.add("ind-swap");
    }
    indStart = performance.now();
  };
  indBtns.forEach((b) => b.addEventListener("click", () => { indAuto = false; indProg.style.transform = "scaleX(1)"; renderInd(+b.dataset.i); }));
  indTabs.addEventListener("keydown", (e) => {
    if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key)) return;
    e.preventDefault();
    indAuto = false;
    const n = (indI + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1) + 9) % 9;
    renderInd(n);
    indBtns[n].focus();
  });
  let indHover = false, indVisible = false;
  const indEl = $(".ind");
  indEl.addEventListener("mouseenter", () => (indHover = true));
  indEl.addEventListener("mouseleave", () => { indHover = false; indStart = performance.now() - parseFloat(indProg.dataset.p || 0) * IND_MS; });
  new IntersectionObserver(([e]) => { indVisible = e.isIntersecting; if (indVisible) indStart = performance.now(); }, { threshold: 0.3 }).observe(indEl);
  const indLoop = (t) => {
    if (indAuto && indVisible && !indHover) {
      const p = Math.min(1, (t - indStart) / IND_MS);
      indProg.dataset.p = p;
      indProg.style.transform = `scaleX(${p})`;
      if (p >= 1) renderInd((indI + 1) % industries.length);
    }
    requestAnimationFrame(indLoop);
  };
  renderInd(0, false);
  requestAnimationFrame(indLoop);
  addEventListener("resize", placeIndInd);

  /* ---------- testimonials ---------- */
  const testimonials = [
    { q: "QuickCRM transformed our sales process. Everything from lead capture to follow ups now lives in one place.", m: "3.1×", ml: "more follow ups completed per rep", n: "James Anderson", r: "Sales Director, TechNova Solutions", c: "#2563EB" },
    { q: "Our Monday review used to start with a spreadsheet hunt. Now we simply open the dashboard.", m: "6h", ml: "saved on weekly reporting", n: "Meera Fernandes", r: "Head of Sales, Coastline Realty", c: "#DB2777" },
    { q: "The 8 AM reminders alone paid for it. Our counsellors stopped losing warm enquiries.", m: "27%", ml: "higher enquiry to enrolment rate", n: "Daniel Okafor", r: "Founder, BrightMind Academy", c: "#0EA5A4" },
    { q: "We reply to every enquiry before customers book elsewhere. Every channel lands in one pipeline.", m: "2.4×", ml: "faster first response", n: "Farhan Qureshi", r: "Operations Head, Skyline Tours", c: "#F97316" },
    { q: "Candidates and client mandates finally live side by side. Nothing gets lost between interviews.", m: "41%", ml: "fewer missed follow ups", n: "Lucia Romero", r: "Recruitment Lead, Northbridge Talent", c: "#0EA5E9" },
  ];
  const tSlides = $("#tSlides"), tPeople = $("#tPeople"), tTimer = $("#tTimer");
  tSlides.innerHTML = testimonials.map((t, i) => `
    <div class="t-slide${i === 0 ? " on" : ""}" aria-hidden="${i !== 0}">
      <blockquote>“${t.q}”</blockquote>
      <div class="t-res"><b>${t.m}</b><span>${t.ml}</span></div>
      <div class="t-who"><span class="av" style="--c:${t.c}">${initials(t.n)}</span><div><b>${t.n}</b><span>${t.r}</span></div></div>
    </div>`).join("");
  tPeople.innerHTML = testimonials.map((t, i) => `<button class="${i === 0 ? "on" : ""}" style="--c:${t.c}" aria-label="Show testimonial from ${t.n}">${initials(t.n)}</button>`).join("");
  const slides = $$(".t-slide", tSlides), people = $$("button", tPeople);
  let tI = 0, tStart = performance.now(), tPaused = false, tVisible = false;
  const T_MS = 6500;
  const goT = (i) => {
    tI = (i + testimonials.length) % testimonials.length;
    slides.forEach((s, j) => { s.classList.toggle("on", j === tI); s.setAttribute("aria-hidden", j !== tI); });
    people.forEach((p, j) => p.classList.toggle("on", j === tI));
    tStart = performance.now();
  };
  people.forEach((p, i) => p.addEventListener("click", () => goT(i)));
  $("#tNext").addEventListener("click", () => goT(tI + 1));
  $("#tPrev").addEventListener("click", () => goT(tI - 1));
  const tFeature = $(".t-feature");
  tFeature.addEventListener("mouseenter", () => (tPaused = true));
  tFeature.addEventListener("mouseleave", () => { tPaused = false; tStart = performance.now(); });
  new IntersectionObserver(([e]) => { tVisible = e.isIntersecting; tStart = performance.now(); }, { threshold: 0.4 }).observe(tFeature);
  const tLoop = (t) => {
    if (tVisible && !tPaused) {
      const p = Math.min(1, (t - tStart) / T_MS);
      tTimer.style.transform = `scaleX(${p})`;
      if (p >= 1) goT(tI + 1);
    }
    requestAnimationFrame(tLoop);
  };
  requestAnimationFrame(tLoop);

  /* ---------- FAQ accordion with height animation ---------- */
  const faqs = $$(".qa");
  const animateQA = (qa, open) => {
    const body = $(".qa-body", qa);
    if (qa._anim) qa._anim.cancel();
    if (open) {
      qa.open = true;
      const h = body.scrollHeight;
      qa._anim = body.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], { duration: reduce ? 0 : 550, easing: "cubic-bezier(0.32,0.72,0,1)" });
    } else {
      const h = body.scrollHeight;
      qa._anim = body.animate([{ height: h + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: reduce ? 0 : 450, easing: "cubic-bezier(0.32,0.72,0,1)" });
      qa._anim.onfinish = () => { qa.open = false; };
    }
  };
  faqs.forEach((qa) => {
    $("summary", qa).addEventListener("click", (e) => {
      e.preventDefault();
      const opening = !qa.open;
      if (opening) faqs.forEach((o) => { if (o !== qa && o.open) animateQA(o, false); });
      animateQA(qa, opening);
    });
  });
  const faqEmpty = $("#faqEmpty");
  faqs.forEach((qa) => { const s = $("summary", qa); s.dataset.raw = s.childNodes[1].textContent; $(".qa-body p", qa).dataset.raw = $(".qa-body p", qa).textContent; });
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  $("#faqSearch").addEventListener("input", (e) => {
    const q = e.target.value.trim();
    const re = q ? new RegExp(`(${esc(q)})`, "ig") : null;
    let shown = 0;
    faqs.forEach((qa) => {
      const s = $("summary", qa), p = $(".qa-body p", qa);
      const text = s.dataset.raw + " " + p.dataset.raw;
      const hit = !q || text.toLowerCase().includes(q.toLowerCase());
      qa.classList.toggle("hide", !hit);
      s.childNodes[1].textContent = s.dataset.raw;
      p.innerHTML = re ? p.dataset.raw.replace(re, "<mark>$1</mark>") : p.dataset.raw;
      if (hit) shown++;
      if (q && hit && p.dataset.raw.toLowerCase().includes(q.toLowerCase()) && !qa.open) qa.open = true;
    });
    faqEmpty.hidden = shown > 0;
  });

  /* ---------- CTA spotlight + forms ---------- */
  const ctaCard = $("#ctaCard");
  ctaCard.addEventListener("mousemove", (e) => {
    const r = ctaCard.getBoundingClientRect();
    ctaCard.style.setProperty("--sx", ((e.clientX - r.left) / r.width) * 100 + "%");
    ctaCard.style.setProperty("--sy", ((e.clientY - r.top) / r.height) * 100 + "%");
  });
  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const wireForm = (form, input, msg, okText) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = input.value.trim();
      form.classList.remove("err");
      if (!v) { msg.textContent = "Please enter your work email."; msg.className = "form-msg bad"; void form.offsetWidth; form.classList.add("err"); input.focus(); return; }
      if (!validEmail(v)) { msg.textContent = "That email looks incomplete. Check the address and try again."; msg.className = "form-msg bad"; void form.offsetWidth; form.classList.add("err"); input.focus(); return; }
      msg.textContent = okText.replace("{email}", v);
      msg.className = "form-msg good";
      input.value = "";
    });
    input.addEventListener("input", () => { form.classList.remove("err"); msg.textContent = ""; });
  };
  wireForm($("#ctaForm"), $("#ctaEmail"), $("#ctaMsg"), "Check {email} for your trial link.");
  wireForm($("#newsForm"), $("#newsEmail"), $("#newsMsg"), "Subscribed. Product updates will go to {email}.");

  runScroll();
})();
