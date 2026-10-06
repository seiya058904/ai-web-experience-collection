import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { createCameraBody } from "./camera-model.js";
import { createOptics } from "./optics-model.js";
import {
  createShutter,
  createSensorMicro,
  createCaptureLight,
} from "./sensor-mechanisms.js";
import { createLightPath } from "./light-path.js";
import {
  clamp,
  lerp,
  smooth,
  apertureLight,
  sensorMagnification,
} from "./story.js";

const desktopPoses = [
  {
    eye: [7.6, 3.1, 11.3],
    target: [0, 0.1, 1.35],
    shift: [0.185, 0.005],
    fov: 35,
  },
  {
    eye: [12.8, 3.65, 20.4],
    target: [0, 0, 5.5],
    shift: [0.065, -0.06],
    fov: 23,
  },
  {
    eye: [9.8, 2.2, 18.4],
    target: [0, 0, 4.3],
    shift: [-0.245, 0.085],
    fov: 35,
  },
  { eye: [0.15, 0.08, 8.1], target: [0, 0, 2], shift: [0.19, -0.015], fov: 35 },
  {
    eye: [0.92, 0.34, 5.35],
    target: [0, 0, 0.22],
    shift: [0.205, -0.035],
    fov: 35,
  },
  {
    eye: [2.1, 1.45, 5.8],
    target: [0, 0, 0.05],
    shift: [0.19, -0.01],
    fov: 34,
  },
  {
    eye: [0.72, 0.4, 5.05],
    target: [0, 0, 0],
    shift: [0.205, -0.035],
    fov: 35,
  },
  {
    eye: [26.25, 8.675, 31.15],
    target: [0, 0.35, 3.1],
    shift: [0.04, -0.015],
    fov: 27,
  },
  {
    eye: [0.35, 0.16, -6.5],
    target: [0.31, -0.05, -1],
    shift: [0, 0],
    fov: 35,
  },
];
const mobilePoses = [
  { eye: [7, 4, 17.5], target: [0, 0.1, 1.5], shift: [0, 0.06], fov: 42 },
  { eye: [2.6, 9, 22.3], target: [0, 0, 5.3], shift: [0, -0.075], fov: 42 },
  { eye: [5, 5, 24], target: [0, 0, 4.2], shift: [0, -0.12], fov: 42 },
  { eye: [0.035, 0.02, 10.1], target: [0, 0, 2], shift: [0, -0.045], fov: 50 },
  { eye: [0.1, 0.02, 6.25], target: [0, 0, 0.22], shift: [0, 0.06], fov: 48 },
  { eye: [1.4, 1.2, 7.35], target: [0, 0, 0.04], shift: [0, 0.09], fov: 43 },
  { eye: [0.12, 0.04, 5.65], target: [0, 0, 0], shift: [0, 0.065], fov: 48 },
  {
    eye: [7.25, 18.65, 33.3],
    target: [0, 0.4, 1.8],
    shift: [0.045, 0.02],
    fov: 40,
  },
  {
    eye: [0.35, 0.16, -10.5],
    target: [0.31, -0.05, -1],
    shift: [0, 0],
    fov: 42,
  },
];

function makeStudioEnvironment(renderer) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x151a1e);
  const resources = [];
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(42, 30, 42),
    new THREE.MeshBasicMaterial({ color: 0x252c31, side: THREE.BackSide }),
  );
  studio.add(wall);
  resources.push(wall);
  function softbox(color, intensity, width, height, position, aim = [0, 0, 1]) {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      material,
    );
    plane.position.fromArray(position);
    plane.lookAt(...aim);
    studio.add(plane);
    resources.push(plane);
  }
  softbox(0xe9f1f1, 7, 13, 5, [0, 9, 5]);
  softbox(0xffffff, 5.5, 1.6, 11, [-8, 2, 5]);
  softbox(0xd4e6ef, 3.5, 4.5, 9, [8, 3, 2]);
  softbox(0xb5bcc9, 1.5, 7, 3, [1, 1, -9]);
  softbox(0xefddc6, 1.3, 2, 8, [4, -3, 8]);
  const generator = new THREE.PMREMGenerator(renderer);
  const environment = generator.fromScene(studio, 0.04, 0.1, 70);
  generator.dispose();
  resources.forEach((mesh) => {
    mesh.geometry.dispose();
    mesh.material.dispose();
  });
  studio.clear();
  return environment;
}

export function createScene(container, photo, onContextLost) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
    stencil: false,
  });
  renderer.setClearColor(0x090b0d, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  container.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.025, 120);
  const environment = makeStudioEnvironment(renderer);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.92;
  RectAreaLightUniformsLib.init();
  const key = new THREE.RectAreaLight(0xf0f6f6, 15, 6, 4);
  key.position.set(-4, 6, 8);
  key.lookAt(0, 0, 2);
  scene.add(key);
  const fill = new THREE.RectAreaLight(0xc9d8ee, 8, 3, 8);
  fill.position.set(7, 3, 1);
  fill.lookAt(0, 0, 2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xecdfd0, 2.5);
  rim.position.set(-6, 4, -4);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xbdcbd6, 0x181610, 0.42));
  const machine = createCameraBody();
  const optics = createOptics();
  const shutter = createShutter();
  const micro = createSensorMicro();
  const captureLight = createCaptureLight();
  const light = createLightPath(optics);
  const rig = new THREE.Group();
  rig.add(
    machine.group,
    optics.group,
    shutter.group,
    micro.group,
    light.group,
    captureLight.group,
  );
  scene.add(rig);
  const photoTexture = new THREE.Texture(photo);
  photoTexture.colorSpace = THREE.SRGBColorSpace;
  photoTexture.needsUpdate = true;
  photoTexture.anisotropy = Math.min(
    8,
    renderer.capabilities.getMaxAnisotropy(),
  );
  const sensorPhotoMaterial = new THREE.MeshBasicMaterial({
    map: photoTexture,
    color: 0x939d96,
    toneMapped: false,
    transparent: true,
    opacity: 0,
  });
  const sensorPhoto = new THREE.Mesh(
    new THREE.PlaneGeometry(1.438, 0.958),
    sensorPhotoMaterial,
  );
  sensorPhoto.position.z = 0.006;
  sensorPhoto.rotation.z = Math.PI;
  machine.parts.sensor.add(sensorPhoto);
  const irisPhotoMaterial = new THREE.MeshBasicMaterial({
    map: photoTexture,
    color: 0x566365,
    toneMapped: false,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
  });
  const irisPhotoGeometry = new THREE.CircleGeometry(0.755, 96);
  const irisUV = irisPhotoGeometry.attributes.uv;
  for (let i = 0; i < irisUV.count; i++)
    irisUV.setX(i, 0.5 + (irisUV.getX(i) - 0.5) / 1.5);
  const irisPhoto = new THREE.Mesh(irisPhotoGeometry, irisPhotoMaterial);
  irisPhoto.position.z = -0.022;
  optics.iris.add(irisPhoto);
  const rearPhotoMaterial = new THREE.MeshBasicMaterial({
    map: photoTexture,
    color: 0x849184,
    toneMapped: false,
    transparent: true,
    opacity: 0,
  });
  const rearPhoto = new THREE.Mesh(
    new THREE.PlaneGeometry(3.24, 1.82),
    rearPhotoMaterial,
  );
  rearPhoto.rotation.y = Math.PI;
  rearPhoto.position.set(0.31, -0.085, -0.119);
  machine.parts.rearShell.add(rearPhoto);

  // A soft studio grounding shadow is a generated texture, never a product image.
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 128;
  const shadowCtx = shadowCanvas.getContext("2d");
  const gradient = shadowCtx.createRadialGradient(64, 64, 1, 64, 64, 64);
  gradient.addColorStop(0, "rgba(0,0,0,.55)");
  gradient.addColorStop(0.35, "rgba(0,0,0,.35)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  shadowCtx.fillStyle = gradient;
  shadowCtx.fillRect(0, 0, 128, 128);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowMaterial = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    depthWrite: false,
    opacity: 0.75,
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -2.25, 1.6);
  scene.add(shadow);
  const focusGeometry = new THREE.BufferGeometry();
  focusGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(15), 3),
  );
  const focusLine = new THREE.Line(
    focusGeometry,
    new THREE.LineBasicMaterial({
      color: 0xd7e2d9,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );
  rig.add(focusLine);

  const labels = ["label-a", "label-b", "label-c", "label-d"].map((id) =>
    document.getElementById(id),
  );
  const vector = new THREE.Vector3(),
    eye = new THREE.Vector3(),
    target = new THREE.Vector3();
  let width = 1,
    height = 1,
    mobile = false,
    landscape = false,
    disposed = false,
    lost = false;
  const photos = [sensorPhoto, rearPhoto, irisPhoto];
  function resize(w, h) {
    width = w;
    height = h;
    mobile = w <= 900;
    landscape = mobile && w > h;
    const pixels = w * h;
    const ceiling = mobile ? 1_700_000 : 4_200_000;
    const ratio = Math.min(
      window.devicePixelRatio || 1,
      mobile ? 1.6 : 1.5,
      Math.sqrt(ceiling / pixels),
    );
    renderer.setPixelRatio(Math.max(0.65, ratio));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  function projectLabel(index, text, object, offset = [0, 0, 0], opacity = 1) {
    const label = labels[index];
    if (opacity < 0.02 || !object) {
      label.style.opacity = "0";
      return;
    }
    vector.fromArray(offset);
    object.localToWorld(vector);
    vector.project(camera);
    const x = (vector.x * 0.5 + 0.5) * width,
      y = (-vector.y * 0.5 + 0.5) * height;
    const visible =
      vector.z > -1 &&
      vector.z < 1 &&
      x > width * 0.045 &&
      x < width * 0.955 &&
      y > height * 0.18 &&
      y < height * 0.72;
    label.textContent = text;
    label.style.left = `${x}px`;
    label.style.top = `${y - (mobile ? 29 : 53)}px`;
    label.style.opacity = visible ? String(opacity) : "0";
  }
  function projectSensorLabel(index, text, object, opacity, mobilePortrait) {
    const label = labels[index];
    if (opacity < 0.02) return;
    vector.set(0, 0, 0);
    object.localToWorld(vector);
    vector.project(camera);
    const anchorX = (vector.x * 0.5 + 0.5) * width,
      anchorY = (-vector.y * 0.5 + 0.5) * height;
    const x = width * (mobilePortrait ? 0.765 : 0.875);
    const y =
      height * (mobilePortrait ? 0.655 - index * 0.062 : 0.67 - index * 0.077);
    const dx = anchorX - x + 8,
      dy = anchorY - y - 6;
    label.className = "sensor-callout";
    label.textContent = text;
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
    label.style.setProperty("--lead-length", `${Math.hypot(dx, dy)}px`);
    label.style.setProperty("--lead-angle", `${Math.atan2(dy, dx)}rad`);
    label.style.setProperty("--dot-x", `${anchorX - x - 1}px`);
    label.style.setProperty("--dot-y", `${anchorY - y - 1}px`);
    label.style.opacity = vector.z > -1 && vector.z < 1 ? String(opacity) : "0";
  }
  function render(frame, controls, time, pointer = { x: 0, y: 0 }) {
    if (disposed || lost) return;
    const w = frame.weights,
      l = frame.locals;
    const mobilePortrait = mobile && !landscape;
    const poses = mobilePortrait ? mobilePoses : desktopPoses;
    const a = poses[frame.from],
      b = poses[frame.to],
      mix = frame.mix;
    eye.fromArray(a.eye).lerp(vector.fromArray(b.eye), mix);
    target.fromArray(a.target).lerp(vector.fromArray(b.target), mix);
    let shiftX = lerp(a.shift[0], b.shift[0], mix),
      shiftY = lerp(a.shift[1], b.shift[1], mix);
    camera.fov = lerp(a.fov, b.fov, mix);
    if (landscape) {
      camera.fov += 7;
      shiftY += 0.03;
    }
    if (mobilePortrait && height <= 700) {
      eye
        .sub(target)
        .multiplyScalar(1 + 0.23 * w[3])
        .add(target);
      shiftY -= 0.058 * w[3];
    }
    // The complete sensor hands its central cells to an authored microscopic study.
    const sensorTravel = smooth(0.12, 0.74, l[5]) * w[5];
    const sensorMacro = sensorMagnification(l[5], controls.reduced) * w[5];
    eye
      .sub(target)
      .multiplyScalar(1 - sensorTravel * (mobilePortrait ? 0.1 : 0.14))
      .add(target);
    eye.lerp(
      vector.fromArray(mobilePortrait ? [2.6, 1.9, 4] : [1.75, 1.25, 2.5]),
      sensorMacro,
    );
    target.lerp(vector.set(-0.03, 0, 0.2), sensorMacro);
    if (mobilePortrait) shiftX -= 0.08 * sensorMacro;
    // Hold composition while allowing a tiny, scroll-driven parallax along the axis.
    const breathing =
      Math.sin(frame.u * 0.62) * 0.011 * (1 - w[3] - w[4] - w[8]);
    eye
      .sub(target)
      .multiplyScalar(1 + breathing)
      .add(target);
    if (!controls.reduced) {
      eye.x += pointer.x * 0.14 * (w[0] + w[7]);
      eye.y += pointer.y * 0.075 * (w[0] + w[7]);
    }
    camera.position.copy(eye);
    camera.lookAt(target);
    camera.setViewOffset(
      width,
      height,
      -width * shiftX,
      -height * shiftY,
      width,
      height,
    );
    camera.updateProjectionMatrix();

    const reassembly = 1 - smooth(0.57, 0.9, l[7]);
    const opticalExpansion =
      w[1] + w[2] * 0.36 + w[7] * reassembly * (mobilePortrait ? 0.45 : 0.88);
    const machineHousing = w[7] * reassembly;
    optics.setExplode(clamp(opticalExpansion), {
      machineHousing,
      mobile: mobilePortrait,
    });
    optics.setFocus(controls.focus);
    optics.setAperture(controls.aperture);
    optics.update(time, frame.u);
    machine.setExplode(clamp(w[7] * reassembly), { portrait: mobilePortrait });
    // The mount carries its complete lens forward when the shell separates.
    optics.group.position.z = Math.max(
      0,
      machine.parts.frontShell.position.z - 0.7,
    );
    const fullBody = w[0] + w[7] + w[8] > 0.025;
    const sensorStage = w[4] + w[5] + w[6] > 0.02;
    machine.group.visible = (fullBody || sensorStage) && sensorMacro < 0.999;
    machine.group.scale.setScalar(
      Math.max(0.001, 1 - smooth(0.2, 0.95, sensorMacro)),
    );
    for (const [name, part] of Object.entries(machine.parts)) {
      if (name === "sensorSurface") continue;
      part.visible =
        fullBody || (sensorStage && ["sensor", "ibis"].includes(name));
    }
    machine.parts.shutterFrame.visible = false;
    machine.sensorSurface.visible = !(w[5] > 0.14);
    const lensVisible = w[0] + w[1] + w[2] + w[7] + w[8] > 0.035;
    optics.group.visible = lensVisible || w[3] > 0.01;
    optics.elements.forEach((element) => {
      element.visible = lensVisible && w[3] < 0.98;
    });
    optics.barrel.visible =
      lensVisible &&
      (opticalExpansion < 0.67 || machineHousing > 0.01) &&
      w[2] < 0.5 &&
      w[3] < 0.55;
    optics.iris.visible = optics.group.visible;
    irisPhoto.visible = w[3] > 0.1;
    irisPhotoMaterial.opacity = 0.56 * w[3];
    shutter.group.visible = w[4] > 0.025 || fullBody;
    shutter.group.position.copy(machine.parts.shutterFrame.position);
    shutter.group.position.z -= 0.26;
    shutter.setExposure(1 / controls.shutter);
    shutter.setPhase(w[4] > 0.1 ? controls.shutterPhase : 1);
    captureLight.update(
      time,
      shutter.getState(),
      0.7 * w[4] + 0.38 * w[5] * (1 - sensorTravel),
      {
        mobile: mobilePortrait,
        shutterOffsetZ: shutter.group.position.z,
      },
    );
    micro.group.visible = w[5] > 0.03;
    micro.setProgress(sensorTravel);
    micro.setMagnification(sensorMacro);
    if (micro.group.visible) micro.update(time);

    // Body disturbances and planar sensor correction share the same deterministic signal.
    const shake = w[6] * (controls.reduced ? 0 : 1);
    const sx =
      (Math.sin(time * 2.15) + Math.sin(time * 3.73) * 0.34) * 0.039 * shake;
    const sy =
      (Math.cos(time * 1.79) + Math.sin(time * 3.17) * 0.28) * 0.028 * shake;
    const sr = Math.sin(time * 1.6) * 0.012 * shake;
    machine.group.position.set(sx, sy, -sensorMacro * 0.7);
    machine.group.rotation.z = sr;
    const counterX = -sx * Math.cos(sr) - sy * Math.sin(sr);
    const counterY = sx * Math.sin(sr) - sy * Math.cos(sr);
    machine.setIBIS(
      controls.stabilization
        ? { x: counterX, y: counterY, roll: -sr }
        : { x: 0, y: 0, roll: 0 },
    );
    sensorPhoto.visible = w[6] > 0.01 || w[4] > 0.01;
    sensorPhotoMaterial.opacity = 0.92 * w[6] + 0.5 * w[4];
    if (w[4] > 0.01)
      sensorPhotoMaterial.opacity *=
        shutter.getState().openFraction > 0.001 ? 1 : 0.15;
    rearPhotoMaterial.opacity = smooth(0.66, 0.96, l[7]) * w[7] + w[8];
    rearPhoto.visible = rearPhotoMaterial.opacity > 0.01;
    shadow.visible = fullBody || w[1] > 0.2;
    shadowMaterial.opacity = 0.6 * (w[0] + w[7]) + 0.17 * w[1];
    shadow.position.z = lerp(1.6, 4, w[1]);
    shadow.scale.x = 1 + w[7] * 0.5;
    const machineRay = w[7] * (1 - smooth(0, 0.012, reassembly));
    light.group.visible = w[0] + w[1] + w[2] + w[3] + machineRay > 0.04;
    const throughput =
      0.22 + 0.78 * Math.sqrt(apertureLight(controls.aperture));
    light.update(
      time,
      frame.u,
      throughput * (w[0] + w[1] + w[2] + w[3] * 0.4 + machineRay * 0.6),
      mobilePortrait,
      w[0] > 0.5,
    );
    focusLine.visible = w[2] > 0.2;
    if (focusLine.visible) {
      const z = 0.14 + (1 - controls.focus) * 0.8;
      const points = [
        [-0.72, -0.48, z],
        [0.72, -0.48, z],
        [0.72, 0.48, z],
        [-0.72, 0.48, z],
        [-0.72, -0.48, z],
      ];
      points.forEach((p, i) =>
        focusGeometry.attributes.position.setXYZ(i, ...p),
      );
      focusGeometry.attributes.position.needsUpdate = true;
      focusLine.material.opacity = w[2] * 0.5;
    }
    const activeLight = 1 + 0.025 * Math.sin(time * 0.25);
    key.intensity = 15 * activeLight;
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    labels.forEach((label) => {
      label.style.opacity = "0";
      label.className = "";
    });
    if (w[1] > 0.6) {
      projectLabel(0, "FRONT GROUP", optics.elements[0], [0, 1.09, 0], w[1]);
      projectLabel(
        1,
        "NINE-BLADE IRIS",
        optics.iris,
        [0, 1.05, 0],
        mobilePortrait ? 0 : w[1],
      );
      projectLabel(2, "FOCUS GROUP", optics.elements[8], [0, 0.7, 0], w[1]);
    } else if (sensorMacro > 0.7) {
      const opacity = smooth(0.7, 0.96, sensorMacro);
      projectSensorLabel(
        0,
        "MICROLENS",
        micro.anchors.microlens,
        opacity,
        mobilePortrait,
      );
      projectSensorLabel(
        1,
        "COLOR FILTER",
        micro.anchors.filter,
        opacity,
        mobilePortrait,
      );
      projectSensorLabel(
        2,
        "PHOTODIODE",
        micro.anchors.photodiode,
        opacity,
        mobilePortrait,
      );
      projectSensorLabel(
        3,
        "READOUT",
        micro.anchors.readout,
        opacity,
        mobilePortrait,
      );
    } else if (w[7] > 0.6 && reassembly > 0.7) {
      projectLabel(
        0,
        "OPTICAL ASSEMBLY",
        optics.elements[1],
        [0, 1, 0],
        mobilePortrait ? 0 : w[7],
      );
      projectLabel(
        1,
        "MAGNESIUM CHASSIS",
        machine.parts.chassis,
        [0, 1.34, 0],
        w[7],
      );
      projectLabel(
        2,
        "IMAGE PROCESSOR",
        machine.parts.pcb,
        [0.6, 1.2, 0],
        w[7],
      );
    } else {
      labels.forEach((label) => {
        label.style.opacity = "0";
      });
    }
    renderer.render(scene, camera);
  }
  function contextLost(event) {
    event.preventDefault();
    lost = true;
    onContextLost?.();
  }
  renderer.domElement.addEventListener("webglcontextlost", contextLost, false);
  function dispose() {
    if (disposed) return;
    disposed = true;
    renderer.domElement.removeEventListener("webglcontextlost", contextLost);
    photos.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
      mesh.removeFromParent();
    });
    photoTexture.dispose();
    machine.dispose();
    optics.dispose();
    shutter.dispose();
    micro.dispose();
    light.dispose();
    captureLight.dispose();
    shadow.geometry.dispose();
    shadowMaterial.dispose();
    shadowTexture.dispose();
    focusGeometry.dispose();
    focusLine.material.dispose();
    environment.dispose();
    scene.clear();
    renderer.dispose();
    renderer.domElement.remove();
  }
  function stats() {
    return {
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      textures: renderer.info.memory.textures,
      geometries: renderer.info.memory.geometries,
      drawingBuffer: [renderer.domElement.width, renderer.domElement.height],
      webgl: !lost,
    };
  }
  return {
    resize,
    render,
    dispose,
    stats,
    renderer,
    scene,
    camera,
    machine,
    optics,
    shutter,
    micro,
  };
}
