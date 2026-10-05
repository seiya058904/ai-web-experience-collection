import { gsap } from "gsap";
import { $, $$, rangeFill, setPressed } from "./dom";
import { aerodynamicForces, raceStrategy, projectCircuit } from "./models";
import type { MotionService } from "./motion";
import circuitData from "./circuits.json";

const parts = {
  front: {
    code: "FRONT WING",
    title: "空气的第一站。",
    copy: "前翼先与气流相遇：一边产生下压力，一边引导空气绕过前轮，交给车身后方。",
  },
  floor: {
    code: "FLOOR",
    title: "贴近地面的秘密。",
    copy: "底板管理车底气流，制造压力差。2026 年的底板更平坦，上一代深地效隧道的作用被削弱；翼面与整车气流仍须共同工作。",
  },
  rear: {
    code: "REAR WING",
    title: "在速度与抓地力之间。",
    copy: "尾翼产生下压力，也带来阻力。2026 主动空气动力学让它与前翼配合，在指定条件下切换高、低阻力配置。",
  },
  halo: {
    code: "COCKPIT PROTECTION",
    title: "速度的背后，是保护。",
    copy: "Halo 是围绕驾驶舱的钛合金保护结构，自 2018 年起引入 F1，帮助抵御前方和上方物体撞击。它与头盔、生存舱共同保护车手。",
  },
};

function windTunnel(motion: MotionService) {
  const { signal } = motion;
  const canvas = $<HTMLCanvasElement>(".airflow-canvas");
  const context = canvas.getContext("2d");
  const scene = $(".wind-tunnel");
  const slider = $<HTMLInputElement>("#air-speed");
  let mode: "corner" | "straight" = "corner";
  let speed = 240;
  let width = 1000;
  let height = 400;
  let elapsed = 0;
  let paths: { x: number; y: number }[][] = [];
  let strokes: Path2D[] = [];

  function geometry() {
    const mobile = innerWidth <= 760;
    paths = Array.from({ length: 10 }, (_, row) =>
      Array.from({ length: 100 }, (_, index) => {
        const x = index / 99;
        const top = row < 7;
        const lift = Math.sin(
          Math.PI * Math.max(0, Math.min(1, (x - 0.04) / 0.91)),
        );
        const y = top
          ? 0.41 + row * 0.027 - lift * (mode === "corner" ? 0.3 : 0.23)
          : 0.7 + (row - 7) * 0.031 + lift * 0.012;
        return { x: x * width, y: (mobile ? 0.15 + y * 0.78 : y) * height };
      }),
    );
    strokes = paths.map((points) => {
      const stroke = new Path2D();
      points.forEach((point, i) =>
        i ? stroke.lineTo(point.x, point.y) : stroke.moveTo(point.x, point.y),
      );
      return stroke;
    });
  }

  function draw() {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    context.lineWidth = 0.7;
    for (const [index, points] of paths.entries()) {
      context.strokeStyle = `rgba(198,39,27,${index % 3 === 0 ? 0.43 : 0.2})`;
      context.stroke(strokes[index]);
      if (motion.reduced) continue;
      for (let particle = 0; particle < 3; particle++) {
        const progress =
          ((elapsed * speed) / 200 + index * 0.073 + particle * 0.33) % 1;
        const head = Math.floor(progress * 98);
        const end = Math.min(99, head + 4);
        context.beginPath();
        context.moveTo(points[head].x, points[head].y);
        for (let p = head + 1; p <= end; p++)
          context.lineTo(points[p].x, points[p].y);
        context.strokeStyle = "rgba(198,39,27,.65)";
        context.lineWidth = 1.25;
        context.stroke();
        context.lineWidth = 0.7;
      }
    }
  }
  const resizeObserver = new ResizeObserver((entries) => {
    const rect = entries[0].contentRect;
    width = rect.width;
    height = rect.height;
    // A 4K/high-DPR viewport must not allocate a full-resolution animated layer.
    const dpr = Math.min(
      devicePixelRatio || 1,
      1.5,
      Math.sqrt(3_000_000 / Math.max(1, width * height)),
    );
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    context?.setTransform(dpr, 0, 0, dpr, 0, 0);
    geometry();
    draw();
  });
  resizeObserver.observe(canvas);
  motion.own(() => resizeObserver.disconnect());
  motion.loop(scene, (_, delta) => {
    elapsed += delta * 0.00017;
    draw();
  });
  motion.onChange(draw);

  function update() {
    speed = Number(slider.value);
    rangeFill(slider);
    $("#speed-value").textContent = String(speed);
    const force = aerodynamicForces(speed, mode);
    $("#downforce-value").textContent = `${force.downforce.toFixed(2)} ×`;
    $("#drag-value").textContent = `${force.drag.toFixed(2)} ×`;
    $("#downforce-bar").style.transform = `scaleX(${force.downforce / 2.01})`;
    $("#drag-bar").style.transform = `scaleX(${force.drag / 2.01})`;
    draw();
  }
  slider.addEventListener("input", update, { signal });
  $$("[data-aero-mode]").forEach((button) =>
    button.addEventListener(
      "click",
      () => {
        mode = button.dataset.aeroMode as "corner" | "straight";
        setPressed("[data-aero-mode]", button);
        scene.dataset.mode = mode;
        $(".aero-mode-copy").textContent =
          mode === "corner"
            ? "弯道模式：较大的翼面角度，优先获得下压力与过弯抓地力。"
            : "直道模式：前、后翼切换至较低阻力配置，牺牲部分下压力，释放直道速度。";
        geometry();
        update();
      },
      { signal },
    ),
  );
  $$("[data-part]").forEach((button) =>
    button.addEventListener(
      "click",
      () => {
        setPressed("[data-part]", button);
        $$("[data-part]").forEach((part) =>
          part.classList.toggle("is-active", part === button),
        );
        const part = parts[button.dataset.part as keyof typeof parts];
        $(".part-code").textContent = part.code;
        $(".part-title").textContent = part.title;
        $(".part-copy").textContent = part.copy;
        motion.refresh();
      },
      { signal },
    ),
  );
  update();
}

function energy(motion: MotionService) {
  const { signal } = motion;
  const path = $<SVGPathElement>("#energy-path");
  const particle = $<SVGCircleElement>(".energy-particle");
  const trace = $<SVGPathElement>(".energy-trace");
  const length = path.getTotalLength();
  const points = Array.from({ length: 257 }, (_, i) =>
    path.getPointAtLength((i / 256) * length),
  );
  let recovering = true;
  let phase = 0.12;
  const battery = { value: 72 };
  let tween: gsap.core.Tween | null = null;
  motion.own(() => tween?.kill());
  const drawBattery = () => {
    const value = Math.round(battery.value);
    $("#battery-value").textContent = `${value}%`;
    $(".battery").setAttribute("aria-valuenow", String(value));
    $(".battery>span").style.transform = `scaleX(${battery.value / 100})`;
  };
  function drawParticle() {
    const index = phase * 256;
    const a = points[Math.floor(index)],
      b = points[Math.min(256, Math.floor(index) + 1)];
    const mix = index % 1;
    particle.style.transform = `translate(${a.x + (b.x - a.x) * mix}px, ${a.y + (b.y - a.y) * mix}px)`;
    trace.style.strokeDashoffset = String(-phase * 100);
  }
  motion.loop($("#energy"), (_, delta) => {
    phase = (phase + delta * 0.000055 * (recovering ? 1 : -1) + 1) % 1;
    drawParticle();
  });
  $$("[data-energy]").forEach((button) =>
    button.addEventListener(
      "click",
      () => {
        recovering = button.dataset.energy === "recover";
        setPressed("[data-energy]", button);
        $("#energy-status").textContent = recovering
          ? "车轮 → MGU-K → 电池"
          : "电池 → MGU-K → 后轮";
        tween?.kill();
        tween = gsap.to(battery, {
          value: recovering ? 88 : 28,
          duration: motion.reduced ? 0 : 1.6,
          ease: "power2.inOut",
          onUpdate: drawBattery,
        });
      },
      { signal },
    ),
  );
  motion.onChange((reduced) => {
    if (reduced) tween?.progress(1);
    drawParticle();
  });
  drawParticle();
}

function tyres(motion: MotionService) {
  const { signal } = motion;
  const compounds = {
    soft: {
      name: "软胎",
      en: "SOFT",
      copy: "更快进入状态。用寿命换速度。",
      grip: 0.9,
      life: 0.32,
      gripText: "较高",
      lifeText: "较低",
      filter: "none",
      color: "红色",
    },
    medium: {
      name: "中性胎",
      en: "MEDIUM",
      copy: "平衡抓地与耐久，为策略留出余地。",
      grip: 0.66,
      life: 0.64,
      gripText: "均衡",
      lifeText: "均衡",
      filter: "hue-rotate(48deg) saturate(1.18)",
      color: "黄色",
    },
    hard: {
      name: "硬胎",
      en: "HARD",
      copy: "需要耐心进入状态，也能把这一段跑得更长。",
      grip: 0.45,
      life: 0.92,
      gripText: "较低",
      lifeText: "较高",
      filter: "grayscale(1) brightness(1.1)",
      color: "白色",
    },
  };
  $$("[data-compound]").forEach((button) =>
    button.addEventListener(
      "click",
      () => {
        setPressed("[data-compound]", button);
        const compound =
          compounds[button.dataset.compound as keyof typeof compounds];
        $("#compound-title").innerHTML =
          `${compound.name} <span>/ ${compound.en}</span>`;
        $("#compound-copy").textContent = compound.copy;
        $("#grip-bar").style.transform = `scaleX(${compound.grip})`;
        $("#life-bar").style.transform = `scaleX(${compound.life})`;
        $("#grip-text").textContent = compound.gripText;
        $("#life-text").textContent = compound.lifeText;
        $("#tyre-image").style.filter = compound.filter;
        $("#tyre-image").setAttribute(
          "alt",
          `带${compound.color}标识圈的${compound.name}光头胎概念示意`,
        );
      },
      { signal },
    ),
  );
}

function strategy(motion: MotionService) {
  const reference = raceStrategy(20);
  const input = $<HTMLInputElement>("#pit-lap");
  const toX = (lap: number) => 42 + (lap / 51) * 622;
  const toY = (time: number) => 170 - (time - 90) * (150 / 18);
  const toPath = (laps: number[]) =>
    laps
      .map(
        (time, index) =>
          `${index === 0 ? "M" : "L"}${toX(index).toFixed(1)},${toY(time).toFixed(1)}`,
      )
      .join(" ");
  $("#reference-line").setAttribute("d", toPath(reference.laps));
  function update() {
    rangeFill(input);
    const result = raceStrategy(Number(input.value));
    $("#pit-lap-value").textContent = String(result.pitLap);
    $("#strategy-line").setAttribute("d", toPath(result.laps));
    const markerX = toX(result.pitLap - 0.5);
    $("#pit-marker").setAttribute("x1", String(markerX));
    $("#pit-marker").setAttribute("x2", String(markerX));
    $("#pit-point").setAttribute("cx", String(toX(result.pitLap)));
    $("#pit-point").setAttribute("cy", String(toY(result.laps[result.pitLap])));
    const difference = result.total - reference.total;
    $("#strategy-delta").textContent =
      Math.abs(difference) < 0.05
        ? "0.0"
        : `${difference < 0 ? "−" : "+"}${Math.abs(difference).toFixed(1)}`;
    $("#strategy-verdict").textContent =
      Math.abs(difference) < 0.05
        ? "与参考策略用时相同"
        : difference < 0
          ? "本模型中，用时更少"
          : "本模型中，用时更多";
    $("#chart-desc").textContent =
      `52圈比赛。你的策略在第${result.pitLap}圈结束时进站，总用时${result.total.toFixed(1)}秒；参考策略第20圈进站，用时${reference.total.toFixed(1)}秒。图中省略22秒进站损失，总时间包含。`;
    motion.refresh();
  }
  input.addEventListener("input", update, { signal: motion.signal });
  update();
}

type Session = { code: string; duration: string; title: string; copy: string };
const weekends: Record<string, Record<string, Session[]>> = {
  standard: {
    friday: [
      {
        code: "FP1",
        duration: "60 MIN",
        title: "第一节自由练习",
        copy: "认识赛道，建立赛车设定的起点。",
      },
      {
        code: "FP2",
        duration: "60 MIN",
        title: "第二节自由练习",
        copy: "长距离模拟，理解轮胎与赛车的真实节奏。",
      },
    ],
    saturday: [
      {
        code: "FP3",
        duration: "60 MIN",
        title: "最后一次练习",
        copy: "确认平衡，准备排位赛的极限单圈。",
      },
      {
        code: "QUALI",
        duration: "18 / 15 / 13 MIN",
        title: "排位赛：Q1 → Q2 → Q3",
        copy: "2026 年 Q1、Q2 各淘汰六名车手，十人进入 Q3。最快者拿下杆位。",
      },
    ],
    sunday: [
      {
        code: "RACE",
        duration: "GRAND PRIX",
        title: "灯灭，比赛开始。",
        copy: "轮胎、能量与进站策略，都要在真实对抗里兑现。通常跑完超过 305 km 的最少整圈数；摩纳哥为超过 260 km。",
      },
      {
        code: "POINTS",
        duration: "25 → 1",
        title: "为两个世界冠军而战",
        copy: "正赛前十名获得积分。车手争夺个人冠军，两位车手的积分共同计入车队冠军。",
      },
    ],
  },
  sprint: {
    friday: [
      {
        code: "FP1",
        duration: "60 MIN",
        title: "只有一次自由练习",
        copy: "准备时间被压缩，车队必须更快找到方向。",
      },
      {
        code: "SQ",
        duration: "12 / 10 / 8 MIN",
        title: "冲刺排位赛",
        copy: "SQ1、SQ2、SQ3 决定冲刺赛的发车顺序。",
      },
    ],
    saturday: [
      {
        code: "SPRINT",
        duration: "100 KM",
        title: "冲刺赛",
        copy: "短距离对决，前八名获得积分；没有强制进站要求。",
      },
      {
        code: "QUALI",
        duration: "18 / 15 / 13 MIN",
        title: "正赛排位赛",
        copy: "另一次独立的排位赛，决定周日大奖赛的发车顺序。",
      },
    ],
    sunday: [
      {
        code: "RACE",
        duration: "GRAND PRIX",
        title: "大奖赛，依然是主角",
        copy: "冲刺赛不会替代正赛。完整的比赛距离，带来更长的策略博弈。",
      },
      {
        code: "POINTS",
        duration: "25 → 1",
        title: "周日的积分重新争夺",
        copy: "正赛前十名计分，与周六冲刺赛积分分别计算。",
      },
    ],
  },
};

function weekend(motion: MotionService) {
  const { signal } = motion;
  let format = "standard";
  let day = "friday";
  function render() {
    $("#weekend-panel").innerHTML = weekends[format][day]
      .map(
        (session) =>
          `<div class="session"><div><span>${session.code}</span><small>${session.duration}</small></div><h4>${session.title}</h4><p>${session.copy}</p></div>`,
      )
      .join("");
    $("#weekend-panel").setAttribute("aria-labelledby", `day-${day}`);
    motion.refresh();
  }
  $$("[data-weekend]").forEach((button) =>
    button.addEventListener(
      "click",
      () => {
        format = button.dataset.weekend!;
        setPressed("[data-weekend]", button);
        render();
      },
      { signal },
    ),
  );
  const tabs = $$<HTMLButtonElement>("[data-day]");
  function select(tab: HTMLButtonElement) {
    day = tab.dataset.day!;
    tabs.forEach((button) => {
      button.setAttribute("aria-selected", String(button === tab));
      button.tabIndex = button === tab ? 0 : -1;
    });
    render();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(tab), { signal });
    tab.addEventListener(
      "keydown",
      (event) => {
        let next = index;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft")
          next = (index + tabs.length - 1) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        tabs[next].focus();
        select(tabs[next]);
      },
      { signal },
    );
  });
}

function circuits(motion: MotionService) {
  const { signal } = motion;
  const tracks = {
    monza: {
      name: "MONZA",
      location: "意大利 · 蒙扎",
      length: "5.793",
      turns: 11,
      desc: "长直道与重刹车区交替。更低的阻力，是这里的通行证；每一次制动，都在考验稳定性。",
    },
    suzuka: {
      name: "SUZUKA",
      location: "日本 · 铃鹿",
      length: "5.807",
      turns: 18,
      desc: "连续的 S 弯与高速变向，让赛车像在跳一支精准的舞。下压力、平衡与轮胎保护，在这里缺一不可。",
    },
    monaco: {
      name: "MONACO",
      location: "摩纳哥 · 蒙特卡洛",
      length: "3.337",
      turns: 19,
      desc: "护栏近在咫尺，直道转瞬即逝。机械抓地力与低速灵活性更重要；排位和赛道位置往往决定机会。",
    },
  };
  let distance = 0;
  let length = 1;
  let points: DOMPoint[] = [];
  let paused = false;
  const path = $<SVGPathElement>(".track-outline");
  const point = $<SVGCircleElement>("#track-car");
  const start = $<SVGCircleElement>("#track-start");
  const pauseButton = $(".track-motion-control");
  function place() {
    const index = distance * 512;
    const a = points[Math.floor(index)],
      b = points[Math.min(512, Math.floor(index) + 1)];
    const mix = index % 1;
    point.style.transform = `translate(${a.x + (b.x - a.x) * mix}px, ${a.y + (b.y - a.y) * mix}px)`;
  }
  function select(key: keyof typeof tracks) {
    const track = tracks[key];
    const coordinates = projectCircuit(
      circuitData[key],
      720,
      440,
      44,
      key === "monza" ? -90 : 0,
    );
    const d =
      coordinates
        .map(
          ([x, y], index) =>
            `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`,
        )
        .join(" ") + " Z";
    $$(".track-outline,.track-shadow,.track-sector").forEach((p) =>
      p.setAttribute("d", d),
    );
    length = path.getTotalLength();
    points = Array.from({ length: 513 }, (_, i) =>
      path.getPointAtLength((i / 512) * length),
    );
    distance = 0;
    start.setAttribute("cx", String(coordinates[0][0]));
    start.setAttribute("cy", String(coordinates[0][1]));
    $("#track-name").textContent = track.name;
    $("#track-location").textContent = track.location;
    $("#track-length").innerHTML = `${track.length} <small>km</small>`;
    $("#track-turns").innerHTML = `${track.turns} <small>弯</small>`;
    $("#track-description").textContent = track.desc;
    $("#track-svg-title").textContent =
      `${track.location}赛道平面轮廓，${track.length}公里，${track.turns}个弯角`;
    place();
    motion.refresh();
  }
  $$("[data-track]").forEach((button) =>
    button.addEventListener(
      "click",
      () => {
        setPressed("[data-track]", button);
        select(button.dataset.track as keyof typeof tracks);
      },
      { signal },
    ),
  );
  function syncPause() {
    const stopped = paused || motion.reduced;
    pauseButton.setAttribute("aria-pressed", String(stopped));
    pauseButton.setAttribute(
      "aria-label",
      stopped ? "播放赛道演示" : "暂停赛道演示",
    );
    pauseButton.innerHTML = stopped
      ? "播放演示 <span>▷</span>"
      : "暂停演示 <span>Ⅱ</span>";
    if (motion.reduced) {
      pauseButton.setAttribute("disabled", "");
      pauseButton.setAttribute("title", "开启动效后可播放");
    } else {
      pauseButton.removeAttribute("disabled");
      pauseButton.removeAttribute("title");
    }
  }
  pauseButton.addEventListener(
    "click",
    () => {
      paused = !paused;
      syncPause();
    },
    { signal },
  );
  motion.onChange(syncPause);
  motion.loop($("#circuits"), (_, delta) => {
    if (!paused) {
      distance = (distance + delta * 0.000048) % 1;
      place();
    }
  });
  select("monza");
  syncPause();
}

export function initInteractions(motion: MotionService) {
  const { signal } = motion;
  windTunnel(motion);
  energy(motion);
  tyres(motion);
  strategy(motion);
  weekend(motion);
  circuits(motion);
  const menu = $(".mobile-nav");
  const toggle = $(".menu-toggle");
  const header = $(".site-header");
  function closeMenu(restoreFocus = false) {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "打开章节导航");
    header.classList.remove("menu-open");
    if (restoreFocus) toggle.focus();
  }
  toggle.addEventListener(
    "click",
    () => {
      const opening = menu.hidden;
      menu.hidden = !opening;
      toggle.setAttribute("aria-expanded", String(opening));
      toggle.setAttribute(
        "aria-label",
        opening ? "关闭章节导航" : "打开章节导航",
      );
      header.classList.toggle("menu-open", opening);
    },
    { signal },
  );
  menu.addEventListener(
    "click",
    (event) => {
      if ((event.target as Element).closest("a")) closeMenu();
    },
    { signal },
  );
  document.addEventListener(
    "click",
    (event) => {
      if (!header.contains(event.target as Node)) closeMenu();
    },
    { signal },
  );
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && !menu.hidden) closeMenu(true);
    },
    { signal },
  );
  matchMedia("(min-width: 761px)").addEventListener(
    "change",
    (event) => {
      if (event.matches) closeMenu();
    },
    { signal },
  );
  $$<HTMLDetailsElement>("details").forEach((details) =>
    details.addEventListener("toggle", () => motion.refresh(), { signal }),
  );
  motion.own(() => closeMenu());
}
