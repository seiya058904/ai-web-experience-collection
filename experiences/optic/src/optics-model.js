import * as THREE from "three";

/**
 * Original 50 mm / f1.4 optical assembly, in 25 mm scene units.
 * Light travels along -Z. This is an authored, physically arranged explanatory
 * prescription, not a claim of an optimized or manufacturer-derived design.
 * All motion is absolute and deterministic; this module owns no render clock.
 */
export function createOptics() {
  const group = new THREE.Group();
  group.name = "OPTIC · 50 / 1.4";
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const instancedMeshes = new Set();
  const owned = (resource, collection) => (collection.add(resource), resource);
  const geometry = (value) => owned(value, geometries);
  const material = (value) => owned(value, materials);
  const TAU = Math.PI * 2;
  const clamp = (value, min = 0, max = 1) =>
    THREE.MathUtils.clamp(Number.isFinite(value) ? value : min, min, max);
  const smooth = (a, b, value) => {
    const t = clamp((value - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const state = {
    explode: 0,
    focus: 0.5,
    fNumber: 1.4,
    apertureRadius: 1 / 1.4,
    machineHousing: 0,
    machineHousingMobile: false,
    disposed: false,
  };

  const blackMetal = material(
    new THREE.MeshPhysicalMaterial({
      color: 0x11181d,
      metalness: 0.94,
      roughness: 0.285,
      clearcoat: 0.26,
      clearcoatRoughness: 0.2,
      envMapIntensity: 0.78,
    }),
  );
  const machinedMetal = material(
    new THREE.MeshStandardMaterial({
      color: 0x68717b,
      metalness: 0.98,
      roughness: 0.22,
      envMapIntensity: 1.15,
    }),
  );
  const darkMachined = material(
    new THREE.MeshPhysicalMaterial({
      color: 0x242c32,
      metalness: 0.98,
      roughness: 0.27,
      clearcoat: 0.2,
      clearcoatRoughness: 0.19,
      envMapIntensity: 0.78,
    }),
  );
  const bladeMaterial = material(
    new THREE.MeshPhysicalMaterial({
      color: 0x5c6975,
      metalness: 0.66,
      roughness: 0.31,
      clearcoat: 0.26,
      clearcoatRoughness: 0.24,
      anisotropy: 0.62,
      anisotropyRotation: 0.35,
      emissive: 0x1c2228,
      emissiveIntensity: 0.78,
      side: THREE.DoubleSide,
      envMapIntensity: 1.2,
    }),
  );
  const bladeSweepUniforms = [];

  function lathe(points, segments = 96) {
    const g = new THREE.LatheGeometry(
      points.map(([r, z]) => new THREE.Vector2(r, z)),
      segments,
    );
    g.rotateX(Math.PI / 2);
    return geometry(g);
  }

  function annulus(inner, outer, depth, mat, z = 0, bevel = 0.007) {
    const b = Math.min(bevel, depth * 0.24, (outer - inner) * 0.2);
    const half = depth / 2;
    const points = [
      [inner + b, -half],
      [outer - b, -half],
      [outer, -half + b],
      [outer, half - b],
      [outer - b, half],
      [inner + b, half],
      [inner, half - b],
      [inner, -half + b],
      [inner + b, -half],
    ];
    const mesh = new THREE.Mesh(lathe(points), mat);
    mesh.position.z = z;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function rim(radius, tube, mat, z = 0) {
    const mesh = new THREE.Mesh(
      geometry(new THREE.TorusGeometry(radius, tube, 6, 96)),
      mat,
    );
    mesh.position.z = z;
    return mesh;
  }

  function canvasTexture(width, height, draw) {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    draw(context, width, height);
    const texture = owned(new THREE.CanvasTexture(canvas), textures);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }

  // The curved surfaces are spherical sections with finite edge thickness.
  // Positive sag means that a surface's center is toward the subject (+Z).
  function sphereRadius(aperture, sag) {
    const h = Math.abs(sag);
    return h < 1e-8 ? Infinity : (aperture * aperture + h * h) / (2 * h);
  }

  function sagAt(r, aperture, sag) {
    if (Math.abs(sag) < 1e-8) return 0;
    const curvature = sphereRadius(aperture, sag);
    const rr = Math.min(Math.abs(r), aperture);
    return (
      Math.sign(sag) *
      (Math.sqrt(Math.max(0, curvature * curvature - rr * rr)) -
        Math.sqrt(Math.max(0, curvature * curvature - aperture * aperture)))
    );
  }

  const elementSpecs = [
    {
      group: 0,
      baseZ: 4.205,
      radius: 1.02,
      thickness: 0.052,
      frontSag: 0.155,
      backSag: 0.092,
      ior: 1.62,
      type: "positive meniscus",
    },
    {
      group: 1,
      baseZ: 3.84,
      radius: 0.975,
      thickness: 0.045,
      frontSag: 0.126,
      backSag: -0.072,
      ior: 1.68,
      type: "biconvex",
    },
    {
      group: 2,
      baseZ: 3.47,
      radius: 0.92,
      thickness: 0.145,
      frontSag: -0.05,
      backSag: 0.055,
      ior: 1.72,
      type: "negative doublet member",
      cementedTo: 3,
    },
    {
      group: 2,
      baseZ: 3.3575,
      radius: 0.92,
      thickness: 0.08,
      frontSag: 0.055,
      backSag: -0.065,
      ior: 1.54,
      type: "positive doublet member",
      cementedTo: 2,
    },
    {
      group: 3,
      baseZ: 2.77,
      radius: 0.84,
      thickness: 0.064,
      frontSag: 0.08,
      backSag: 0.025,
      ior: 1.6,
      type: "positive meniscus",
    },
    {
      group: 4,
      baseZ: 1.78,
      radius: 0.72,
      thickness: 0.08,
      frontSag: 0.075,
      backSag: -0.035,
      ior: 1.63,
      type: "biconvex",
    },
    {
      group: 5,
      baseZ: 1.49,
      radius: 0.675,
      thickness: 0.108,
      frontSag: -0.026,
      backSag: 0.034,
      ior: 1.69,
      type: "negative doublet member",
      cementedTo: 7,
    },
    {
      group: 5,
      baseZ: 1.412,
      radius: 0.675,
      thickness: 0.048,
      frontSag: 0.034,
      backSag: -0.03,
      ior: 1.55,
      type: "positive doublet member",
      cementedTo: 6,
    },
    {
      group: 6,
      baseZ: 1.16,
      radius: 0.64,
      thickness: 0.038,
      frontSag: 0.046,
      backSag: -0.028,
      ior: 1.61,
      type: "positive focus member",
      focus: true,
    },
    {
      group: 7,
      baseZ: 0.975,
      radius: 0.602,
      thickness: 0.096,
      frontSag: -0.023,
      backSag: 0.035,
      ior: 1.73,
      type: "negative focus member",
      focus: true,
    },
  ].map((spec, index) => ({
    ...spec,
    index,
    edgeThickness: spec.thickness,
    frontCurve:
      Math.sign(spec.frontSag) * sphereRadius(spec.radius, spec.frontSag),
    backCurve:
      Math.sign(spec.backSag) * sphereRadius(spec.radius, spec.backSag),
    powerSign: Math.sign(spec.frontSag - spec.backSag),
    centerThickness: spec.thickness + spec.frontSag - spec.backSag,
  }));

  const elements = [];
  const glassMaterials = [];
  const groupBase = [4.205, 3.84, 3.47, 2.77, 1.78, 1.49, 1.16, 0.975];
  const groupExploded = [10.78, 9.37, 8.12, 6.6, 3.88, 2.97, 1.97, 1.0];

  function coatedOpticalGlass(spec, index) {
    // One pass per curved element. A Fresnel surface carries a deliberately
    // authored dark studio reflection field; no pale diffuse lobe, screen
    // transmission buffer, added glass shells, or full-frame refraction pass.
    // The geometry and geometric Snell ray solver remain independent of this
    // product-film shading approximation.
    const glass = material(
      new THREE.ShaderMaterial({
        name: "Dark multicoated optical glass",
        transparent: true,
        depthWrite: false,
        side: THREE.FrontSide,
        uniforms: {
          uRadius: { value: spec.radius },
          uIor: { value: spec.ior },
          uCoatingPhase: { value: 0.55 + index * 0.44 },
          uLife: { value: 0 },
          uOpacity: { value: 1 },
          uReflection: { value: index === 0 ? 1.14 : 1 },
        },
        vertexShader: `
        attribute float aOpticalThickness;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        varying vec3 vOpticalPosition;
        varying float vOpticalThickness;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          vWorldNormal = (vec4(normalize(normalMatrix * normal), 0.0) * viewMatrix).xyz;
          vOpticalPosition = position;
          vOpticalThickness = aOpticalThickness;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
        fragmentShader: `
        uniform float uRadius;
        uniform float uIor;
        uniform float uCoatingPhase;
        uniform float uLife;
        uniform float uOpacity;
        uniform float uReflection;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        varying vec3 vOpticalPosition;
        varying float vOpticalThickness;

        // Reflected rays intersect finite softboxes on a distant studio dome.
        // As the actual curved normal changes, a strip bends across the glass.
        float softbox(vec3 ray, vec3 direction, vec2 size, float feather) {
          vec3 forward = normalize(direction);
          vec3 up = abs(forward.y) > 0.94 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
          vec3 right = normalize(cross(up, forward));
          up = cross(forward, right);
          float facing = dot(ray, forward);
          vec3 hit = ray / max(facing, 0.001) - forward;
          vec2 p = abs(vec2(dot(hit, right), dot(hit, up)));
          // Graded radiance across the whole reflected source, including its
          // center. A softbox should reveal curvature, not paint a hard strip.
          vec2 q = p / max(size + vec2(feather), vec2(0.025));
          float grade = exp(-0.82 * q.x * q.x - 0.50 * q.y * q.y);
          return grade * smoothstep(0.02, 0.10, facing);
        }

        vec3 studio(vec3 ray) {
          vec3 result = vec3(0.009, 0.014, 0.022);
          result += vec3(0.013, 0.017, 0.023) * max(ray.y, 0.0);
          float key = softbox(ray, vec3(0.02, 0.87, 0.49), vec2(0.60, 0.24), 0.10);
          float strip = softbox(ray, vec3(-0.81, 0.20, 0.51), vec2(0.09, 0.56), 0.075);
          float cool = softbox(ray, vec3(0.88, 0.24, 0.40), vec2(0.16, 0.60), 0.085);
          float low = softbox(ray, vec3(-0.42, -0.28, 0.86), vec2(0.15, 0.37), 0.08);
          result += vec3(0.78, 0.84, 0.91) * key;
          result += vec3(1.12, 1.23, 1.34) * strip;
          result += vec3(0.26, 0.61, 0.75) * cool;
          result += vec3(0.35, 0.24, 0.58) * low * 0.50;
          return result;
        }

        void main() {
          vec3 normal = normalize(vWorldNormal);
          vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
          if (dot(normal, viewDirection) < 0.0) normal = -normal;
          float ndv = clamp(dot(normal, viewDirection), 0.0, 1.0);
          float f0 = pow((uIor - 1.0) / (uIor + 1.0), 2.0);
          float fresnel = f0 + (1.0 - f0) * pow(1.0 - ndv, 5.0);
          float radial = clamp(length(vOpticalPosition.xy) / uRadius, 0.0, 1.0);
          float edge = smoothstep(0.78, 0.995, radial);
          float opticalPath = vOpticalThickness / max(ndv, 0.23);
          float thickness = 1.0 - exp(-opticalPath * 3.3);
          vec3 reflected = reflect(-viewDirection, normal);
          // A minute change in the reflected light, not in optical geometry.
          reflected.x += sin(uLife) * 0.0025;
          reflected = normalize(reflected);
          vec3 reflection = studio(reflected);
          float film = 0.5 + 0.5 * sin(ndv * 5.4 + uCoatingPhase + radial * 0.32);
          vec3 coating = mix(vec3(0.12, 0.43, 0.55), vec3(0.40, 0.22, 0.57), film);
          vec3 tint = mix(vec3(0.87, 0.94, 1.0), coating * 1.32, 0.39);
          vec3 deepGlass = mix(vec3(0.003, 0.009, 0.016), vec3(0.005, 0.015, 0.020), normal.y * 0.5 + 0.5);
          vec3 color = deepGlass + reflection * tint * uReflection * (1.0 - thickness * 0.10);
          color += coating * (fresnel * 0.13 + edge * 0.045 + thickness * 0.032);
          float highlight = max(reflection.r, max(reflection.g, reflection.b));
          float alpha = 0.045 + fresnel * 0.58 + edge * 0.09 + min(highlight, 1.5) * 0.13 + thickness * 0.045;
          gl_FragColor = vec4(color, clamp(alpha * uOpacity, 0.0, 0.92));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      }),
    );
    glass.userData.opticalSurface =
      "single-pass Fresnel / authored studio reflection";
    return glass;
  }

  elementSpecs.forEach((spec, index) => {
    const opticalElement = new THREE.Group();
    opticalElement.name = `Glass ${String(index + 1).padStart(2, "0")} · ${spec.type}`;
    opticalElement.position.z = spec.baseZ;
    Object.assign(opticalElement.userData, spec);
    opticalElement.userData.explodedZ =
      groupExploded[spec.group] + spec.baseZ - groupBase[spec.group];

    const profile = [];
    const divisions = 24;
    for (let step = 0; step <= divisions; step++) {
      const r = (spec.radius * step) / divisions;
      profile.push([
        r,
        -spec.thickness / 2 + sagAt(r, spec.radius, spec.backSag),
      ]);
    }
    for (let step = divisions; step >= 0; step--) {
      const r = (spec.radius * step) / divisions;
      profile.push([
        r,
        spec.thickness / 2 + sagAt(r, spec.radius, spec.frontSag),
      ]);
    }
    profile.push(profile[0]);

    const glass = coatedOpticalGlass(spec, index);
    glassMaterials.push(glass);
    const lensGeometry = lathe(profile);
    const positions = lensGeometry.attributes.position;
    const localThickness = new Float32Array(positions.count);
    for (let vertex = 0; vertex < positions.count; vertex++) {
      const radius = Math.hypot(positions.getX(vertex), positions.getY(vertex));
      localThickness[vertex] =
        spec.thickness +
        sagAt(radius, spec.radius, spec.frontSag) -
        sagAt(radius, spec.radius, spec.backSag);
    }
    lensGeometry.setAttribute(
      "aOpticalThickness",
      new THREE.BufferAttribute(localThickness, 1),
    );
    const mesh = new THREE.Mesh(lensGeometry, glass);
    mesh.name = "Curved optical glass";
    mesh.renderOrder = 3;
    mesh.onBeforeRender = (
      _renderer,
      _scene,
      _camera,
      _geometry,
      drawMaterial,
    ) => {
      drawMaterial.uniforms.uOpacity.value = drawMaterial.opacity;
    };
    opticalElement.add(mesh);

    // A polished edge is a surface detail, not an emissive outline.
    const edgeMaterial = material(
      new THREE.MeshPhysicalMaterial({
        color: index % 2 ? 0x37485c : 0x294a53,
        metalness: 0.64,
        roughness: 0.1,
        clearcoat: 0.85,
        clearcoatRoughness: 0.07,
        transparent: true,
        opacity: 0.43,
        depthWrite: false,
        envMapIntensity: 0.95,
      }),
    );
    opticalElement.add(
      rim(spec.radius - 0.003, 0.008, edgeMaterial, spec.thickness / 2),
    );
    opticalElement.add(
      rim(spec.radius - 0.003, 0.005, edgeMaterial, -spec.thickness / 2),
    );
    opticalElement.userData.glass = mesh;
    elements.push(opticalElement);
    group.add(opticalElement);
  });

  // Barrel: three machined housings, with a widened diaphragm pocket and a
  // stepped rear mount. Neither housing is a capped cylinder.
  const barrel = new THREE.Group();
  barrel.name = "Anodized barrel housings";
  const frontHousing = new THREE.Group();
  frontHousing.name = "Front optical housing";
  const middleHousing = new THREE.Group();
  middleHousing.name = "Middle helicoid sleeve";
  const rearHousing = new THREE.Group();
  rearHousing.name = "Rear diaphragm housing and mount";
  barrel.add(frontHousing, middleHousing, rearHousing);
  group.add(barrel);

  const barrelBlack = material(blackMetal.clone());
  const barrelEdge = material(darkMachined.clone());
  const barrelBright = material(machinedMetal.clone());
  const knurlMaterial = material(
    new THREE.MeshStandardMaterial({
      color: 0x25272b,
      metalness: 0.82,
      roughness: 0.385,
      envMapIntensity: 1.0,
    }),
  );

  const frontProfile = [
    [1.22, 3.395],
    [1.22, 3.44],
    [1.18, 3.49],
    [1.18, 3.75],
    [1.192, 3.78],
    [1.192, 4.24],
    [1.214, 4.29],
    [1.245, 4.32],
    [1.245, 4.475],
    [1.235, 4.515],
    [1.042, 4.515],
    [1.035, 4.485],
    [1.035, 4.3],
    [1.03, 4.25],
    [1.025, 3.395],
    [1.22, 3.395],
  ];
  const frontShell = new THREE.Mesh(lathe(frontProfile), barrelBlack);
  frontShell.castShadow = true;
  frontShell.receiveShadow = true;
  frontHousing.add(frontShell);
  const rearProfile = [
    [0.88, 0.79],
    [0.96, 0.8],
    [0.96, 0.905],
    [1.07, 0.93],
    [1.09, 1.02],
    [1.09, 1.2],
    [1.13, 1.25],
    [1.13, 1.59],
    [1.2, 1.69],
    [1.305, 1.84],
    [1.305, 2.65],
    [1.28, 2.72],
    [1.025, 2.72],
    [1.025, 2.3],
    [1.282, 2.17],
    [1.282, 1.86],
    [0.89, 1.72],
    [0.75, 0.94],
    [0.75, 0.79],
    [0.88, 0.79],
  ];
  const rearShell = new THREE.Mesh(lathe(rearProfile), barrelBlack);
  rearShell.castShadow = true;
  rearShell.receiveShadow = true;
  rearHousing.add(rearShell);
  const middleProfile = [
    [1.28, 2.724],
    [1.28, 3.3],
    [1.22, 3.4],
    [1.025, 3.4],
    [1.025, 2.724],
    [1.28, 2.724],
  ];
  const middleShell = new THREE.Mesh(lathe(middleProfile), barrelBlack);
  middleShell.castShadow = true;
  middleShell.receiveShadow = true;
  middleHousing.add(middleShell);
  frontHousing.add(annulus(1.038, 1.243, 0.018, barrelEdge, 4.501, 0.003));
  frontHousing.add(rim(1.243, 0.007, barrelBright, 4.487));
  frontHousing.add(rim(1.191, 0.0045, barrelBright, 4.255));
  frontHousing.add(rim(1.183, 0.004, barrelEdge, 3.764));
  rearHousing.add(annulus(0.758, 0.965, 0.033, barrelBright, 0.803));
  rearHousing.add(rim(1.085, 0.006, barrelEdge, 1.19));
  rearHousing.add(rim(1.3, 0.006, barrelBright, 2.64));

  // Filter thread grooves are actual concentric geometry recessed in the lip.
  for (let i = 0; i < 5; i++) {
    frontHousing.add(
      rim(1.041 + i * 0.001, 0.0035, barrelEdge, 4.365 + i * 0.023),
    );
  }

  function knurledRing(parent, radius, length, z, count = 120) {
    const assembly = new THREE.Group();
    assembly.position.z = z;
    assembly.add(
      annulus(radius - 0.057, radius - 0.012, length + 0.022, barrelEdge),
    );
    const ridge = geometry(new THREE.BoxGeometry(0.026, 0.018, length));
    const instances = new THREE.InstancedMesh(ridge, knurlMaterial, count);
    instancedMeshes.add(instances);
    instances.name = `${count} individually raised machining ridges`;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const angle = (i * TAU) / count;
      dummy.position.set(
        Math.cos(angle) * (radius - 0.01),
        Math.sin(angle) * (radius - 0.01),
        0,
      );
      dummy.rotation.set(0, 0, angle);
      dummy.updateMatrix();
      instances.setMatrixAt(i, dummy.matrix);
    }
    instances.instanceMatrix.needsUpdate = true;
    instances.castShadow = true;
    instances.receiveShadow = true;
    assembly.add(instances);
    assembly.add(rim(radius - 0.013, 0.004, barrelBright, length / 2 + 0.009));
    assembly.add(rim(radius - 0.013, 0.004, barrelEdge, -length / 2 - 0.009));
    parent.add(assembly);
    return assembly;
  }

  const focusRing = knurledRing(middleHousing, 1.305, 0.43, 3.015);
  focusRing.name = "Rotating manual focus ring";
  knurledRing(rearHousing, 1.15, 0.145, 1.42);

  const frontMarkings = canvasTexture(1024, 1024, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#d2d0c8";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    function arcText(text, middle, radius, font) {
      ctx.font = font;
      const widths = [...text].map(
        (letter) => ctx.measureText(letter).width + 3,
      );
      let cursor = middle - widths.reduce((sum, w) => sum + w, 0) / radius / 2;
      [...text].forEach((letter, index) => {
        const step = widths[index] / radius;
        const angle = cursor + step / 2;
        ctx.save();
        ctx.translate(
          width / 2 + Math.cos(angle) * radius,
          height / 2 + Math.sin(angle) * radius,
        );
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillText(letter, 0, 0);
        ctx.restore();
        cursor += step;
      });
    }
    arcText("50 mm   1 : 1.4", -Math.PI / 2, 463, "500 29px Arial, sans-serif");
    arcText("MULTI-COATED", Math.PI / 2, 463, "400 18px Arial, sans-serif");
    ctx.fillStyle = "#b9aa8e";
    ctx.beginPath();
    ctx.arc(512, 61, 3, 0, TAU);
    ctx.fill();
  });
  if (frontMarkings) {
    const textMaterial = material(
      new THREE.MeshStandardMaterial({
        color: 0xd2d0c8,
        map: frontMarkings,
        transparent: true,
        metalness: 0.38,
        roughness: 0.63,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
    );
    const label = new THREE.Mesh(
      geometry(new THREE.RingGeometry(1.042, 1.235, 96)),
      textMaterial,
    );
    label.position.z = 4.512;
    label.renderOrder = 2;
    frontHousing.add(label);
  }

  const focusMarkings = canvasTexture(2048, 256, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#c9c8c2";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "400 45px Arial, sans-serif";
    const marks = ["0.45", "0.7", "1", "2", "5", "∞"];
    for (let i = 0; i < marks.length; i++) {
      const x = 650 + i * 124;
      ctx.fillText(marks[i], x, 132);
      ctx.fillRect(x - 1.5, 50, 3, 35);
    }
    ctx.font = "400 28px Arial, sans-serif";
    ctx.fillText("m", 1432, 137);
  });
  if (focusMarkings) {
    const markingMaterial = material(
      new THREE.MeshStandardMaterial({
        map: focusMarkings,
        color: 0xc9c8c2,
        metalness: 0.3,
        roughness: 0.66,
        transparent: true,
        depthWrite: false,
      }),
    );
    const markingGeometry = geometry(
      new THREE.CylinderGeometry(1.283, 1.283, 0.22, 96, 1, true),
    );
    markingGeometry.rotateX(Math.PI / 2);
    const markingBand = new THREE.Mesh(markingGeometry, markingMaterial);
    markingBand.position.z = 2.738;
    middleHousing.add(markingBand);
    focusRing.userData.markingBand = markingBand;
  }

  // A single index mark is attached to the fixed housing, not the focus ring.
  const indexGeometry = geometry(new THREE.BoxGeometry(0.018, 0.007, 0.093));
  const indexMark = new THREE.Mesh(
    indexGeometry,
    material(
      new THREE.MeshStandardMaterial({
        color: 0xbba987,
        metalness: 0.45,
        roughness: 0.48,
      }),
    ),
  );
  indexMark.position.set(0, 1.307, 2.6);
  rearHousing.add(indexMark);

  // Nine rigid blades pivot about nine fixed bearings. The straight working
  // edges form a real nonagon; the outside of each blade is a curved leaf.
  // r = pivotRadius*cos(bladeAngle) + edgeOffset, hence r = 1/f exactly.
  // The broad hidden portions overlap behind the stationary annular cover.
  const iris = new THREE.Group();
  iris.name = "Nine-blade iris";
  iris.position.z = 2;
  iris.userData.baseZ = 2;
  iris.userData.explodedZ = 4.6;
  iris.userData.bladeCount = 9;
  iris.userData.outerRadius = 1.278;
  group.add(iris);

  // Local inspection fill belongs to this mechanism. It makes the dark metal
  // legible head-on without raising exposure across the photograph or camera.
  const irisFaceMaterial = material(
    new THREE.MeshPhysicalMaterial({
      color: 0x3c4852,
      metalness: 0.72,
      roughness: 0.29,
      clearcoat: 0.28,
      clearcoatRoughness: 0.22,
      envMapIntensity: 1.25,
      emissive: 0x18212a,
      emissiveIntensity: 0.72,
    }),
  );
  const irisTrimMaterial = material(
    new THREE.MeshPhysicalMaterial({
      color: 0x7a8792,
      metalness: 0.82,
      roughness: 0.24,
      clearcoat: 0.25,
      clearcoatRoughness: 0.19,
      envMapIntensity: 1.2,
      emissive: 0x182029,
      emissiveIntensity: 0.4,
    }),
  );
  iris.add(annulus(0.78, 1.278, 0.065, darkMachined, -0.054));
  iris.add(annulus(0.78, 1.278, 0.043, irisFaceMaterial, 0.068));
  iris.add(rim(1.269, 0.009, irisTrimMaterial, 0.07));
  iris.add(rim(0.783, 0.004, irisTrimMaterial, 0.086));
  iris.add(rim(1.177, 0.0045, irisTrimMaterial, 0.092));

  const pivotRadius = 0.99;
  const edgeOffset = -0.075;
  const openAngle = Math.acos((1 / 1.4 - edgeOffset) / pivotRadius);
  const leafOuterRadius = 1.22;
  const circleX = -pivotRadius * Math.cos(openAngle);
  const circleY = pivotRadius * Math.sin(openAngle);
  const outerX = (y) =>
    circleX +
    Math.sqrt(
      Math.max(0, leafOuterRadius * leafOuterRadius - (y - circleY) ** 2),
    );
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(edgeOffset, -0.26);
  bladeShape.lineTo(edgeOffset, 1.39);
  bladeShape.lineTo(outerX(1.39), 1.39);
  for (let i = 1; i <= 48; i++) {
    const y = 1.39 - (i / 48) * 1.65;
    bladeShape.lineTo(outerX(y), y);
  }
  bladeShape.closePath();
  const bladeGeometry = geometry(
    new THREE.ExtrudeGeometry(bladeShape, {
      depth: 0.0032,
      bevelEnabled: true,
      bevelThickness: 0.0006,
      bevelSize: 0.0007,
      bevelSegments: 1,
      steps: 1,
      curveSegments: 32,
    }),
  );
  const bladeMeshes = [];
  const bladePivots = [];
  const pinGeometry = geometry(
    new THREE.CylinderGeometry(0.025, 0.025, 0.014, 24),
  );
  pinGeometry.rotateX(Math.PI / 2);
  const screwGeometry = geometry(
    new THREE.CylinderGeometry(0.031, 0.029, 0.014, 24),
  );
  screwGeometry.rotateX(Math.PI / 2);
  const slotGeometry = geometry(new THREE.BoxGeometry(0.037, 0.006, 0.003));
  const bladeTones = [0.82, 1.2, 0.95, 1.26, 0.87, 1.12, 0.79, 1.17, 0.96];
  for (let index = 0; index < 9; index++) {
    const angle = (index * TAU) / 9;
    const pivot = new THREE.Group();
    pivot.position.set(
      Math.cos(angle) * pivotRadius,
      Math.sin(angle) * pivotRadius,
      -0.015 + index * 0.0038,
    );
    pivot.userData.baseAngle = angle;
    pivot.name = `Fixed bearing ${index + 1}`;
    const vaneMaterial = material(bladeMaterial.clone());
    vaneMaterial.color.multiplyScalar(bladeTones[index]);
    vaneMaterial.emissiveIntensity *= 0.86 + bladeTones[index] * 0.22;
    vaneMaterial.roughness = 0.29 + (index % 3) * 0.025;
    vaneMaterial.anisotropyRotation = angle + 0.35;
    const sweep = { value: 0.43 + Math.sin(index * 0.51) * 0.18 };
    bladeSweepUniforms.push(sweep);
    vaneMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uVaneSweep = sweep;
      shader.vertexShader =
        "varying vec2 vVanePosition;\n" +
        shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvVanePosition = position.xy;",
        );
      shader.fragmentShader =
        "varying vec2 vVanePosition;\nuniform float uVaneSweep;\n" +
        shader.fragmentShader.replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          float inspectionSweep = exp(-pow((vVanePosition.y * 0.55 + vVanePosition.x * 0.72 - uVaneSweep) / 0.40, 2.0));
          float workingEdge = 1.0 - smoothstep(0.0009, 0.0055, abs(vVanePosition.x + 0.075));
          totalEmissiveRadiance += vec3(0.014, 0.017, 0.020) * (0.30 + inspectionSweep * 0.65);
          totalEmissiveRadiance += vec3(0.060, 0.067, 0.075) * workingEdge;
        `,
        );
    };
    vaneMaterial.customProgramCacheKey = () => "optic-iris-inspection-v1";
    const blade = new THREE.Mesh(bladeGeometry, vaneMaterial);
    blade.name = `Iris blade ${index + 1}`;
    blade.castShadow = true;
    blade.receiveShadow = true;
    blade.userData.pivot = pivot;
    pivot.add(blade);
    iris.add(pivot);
    bladeMeshes.push(blade);
    bladePivots.push(pivot);
    const pin = new THREE.Mesh(pinGeometry, irisTrimMaterial);
    pin.position.set(
      Math.cos(angle) * pivotRadius,
      Math.sin(angle) * pivotRadius,
      0.095,
    );
    iris.add(pin);
  }
  for (let index = 0; index < 6; index++) {
    const angle = (index * TAU) / 6 + 0.18;
    const screw = new THREE.Mesh(screwGeometry, irisTrimMaterial);
    screw.position.set(Math.cos(angle) * 1.217, Math.sin(angle) * 1.217, 0.093);
    const slot = new THREE.Mesh(slotGeometry, blackMetal);
    slot.position.z = 0.009;
    slot.rotation.z = angle * 1.7;
    screw.add(slot);
    iris.add(screw);
  }
  iris.userData.bladeMeshes = bladeMeshes;
  iris.userData.bladePivots = bladePivots;
  iris.userData.apertureRadius = state.apertureRadius;

  // Freeze a genuinely local fade set. No material used by the iris/glass can
  // ever enter barrelMaterialStates, even if a future trim mesh reuses one.
  const externalMaterials = new Set();
  group.children
    .filter((child) => child !== barrel)
    .forEach((child) =>
      child.traverse((object) => {
        if (!object.material) return;
        (Array.isArray(object.material)
          ? object.material
          : [object.material]
        ).forEach((mat) => externalMaterials.add(mat));
      }),
    );
  const isolatedMaterials = new Map();
  const isolateBarrelMaterial = (mat) => {
    if (!externalMaterials.has(mat)) return mat;
    if (!isolatedMaterials.has(mat))
      isolatedMaterials.set(mat, material(mat.clone()));
    return isolatedMaterials.get(mat);
  };
  const barrelMaterialStates = new Map();
  barrel.traverse((child) => {
    if (!child.isMesh) return;
    child.material = Array.isArray(child.material)
      ? child.material.map(isolateBarrelMaterial)
      : isolateBarrelMaterial(child.material);
    const list = Array.isArray(child.material)
      ? child.material
      : [child.material];
    for (const mat of list) {
      if (!barrelMaterialStates.has(mat)) {
        barrelMaterialStates.set(mat, {
          opacity: mat.opacity,
          transparent: mat.transparent,
          depthWrite: mat.depthWrite,
        });
      }
    }
  });
  barrel.userData.housingSegments = [frontHousing, middleHousing, rearHousing];
  barrel.userData.focusRing = focusRing;
  barrel.userData.outerRadius = 1.31;
  barrel.userData.fadeMaterials = [...barrelMaterialStates.keys()];
  barrel.userData.machineLane = {
    desktop: { x: 0, y: -2.47 },
    mobile: { x: 2.5, y: -0.08 },
    localMaximumRadius: 1.32,
    assembledAxialRanges: [
      [3.395, 4.515],
      [2.628, 3.4],
      [0.79, 2.72],
    ],
    explodedAxialRanges: [
      [9.97, 11.09],
      [5.693, 6.465],
      [1.11, 3.04],
    ],
  };
  const opticalGroups = groupBase.map((baseZ, index) => ({
    index,
    baseZ,
    explodedZ: groupExploded[index],
    elements: elements.filter((element) => element.userData.group === index),
  }));

  function applyPositions() {
    const travel = (0.5 - state.focus) * 0.25;
    elements.forEach((element, index) => {
      const spec = elementSpecs[index];
      const z = THREE.MathUtils.lerp(
        spec.baseZ,
        element.userData.explodedZ,
        state.explode,
      );
      element.position.z = z + (spec.focus ? travel : 0);
      element.userData.liveZ = element.position.z;
    });
    iris.position.z = THREE.MathUtils.lerp(2, 4.6, state.explode);
    iris.userData.liveZ = iris.position.z;
  }

  function applyBarrelPlacement() {
    const open = smooth(0.015, 0.45, state.explode);
    frontHousing.position.set(-0.38 * open, -2.45 * open, state.explode * 3.6);
    frontHousing.rotation.set(0.1 * open, -0.075 * open, 0);
    middleHousing.position.set(0.12 * open, 2.35 * open, -0.12 * state.explode);
    middleHousing.rotation.set(-0.105 * open, 0.065 * open, 0);
    rearHousing.position.set(0.24 * open, 2.35 * open, -0.12 * state.explode);
    rearHousing.rotation.set(-0.105 * open, 0.065 * open, 0);
    const baseOpacity = 1 - smooth(0.12, 0.67, state.explode);
    const placement = smooth(0, 0.28, state.machineHousing);
    const separation = smooth(0.05, 0.55, state.explode);
    const lane = state.machineHousingMobile
      ? barrel.userData.machineLane.mobile
      : barrel.userData.machineLane.desktop;
    const shifts = [6.575, 3.065, 0.32];
    barrel.userData.housingSegments.forEach((segment, index) => {
      if (placement > 0) {
        segment.position.x = THREE.MathUtils.lerp(
          segment.position.x,
          lane.x * separation,
          placement,
        );
        segment.position.y = THREE.MathUtils.lerp(
          segment.position.y,
          lane.y * separation,
          placement,
        );
        segment.position.z = THREE.MathUtils.lerp(
          segment.position.z,
          shifts[index] * state.explode,
          placement,
        );
        segment.rotation.x *= 1 - placement;
        segment.rotation.y *= 1 - placement;
      }
    });
    // Move the already-faded shells into their lane before bringing them back
    // to full material opacity. On reverse travel they disappear first.
    const inspectionOpacity =
      smooth(0.28, 0.62, state.machineHousing) *
      smooth(0.1, 0.55, state.explode);
    const opacity = Math.max(baseOpacity, inspectionOpacity);
    barrel.userData.housingSegments.forEach((segment) => {
      segment.visible = opacity > 0.002;
    });
    barrelMaterialStates.forEach((base, mat) => {
      mat.opacity = base.opacity * opacity;
      const transparent = base.transparent || opacity < 0.999;
      if (mat.transparent !== transparent) {
        mat.transparent = transparent;
        mat.needsUpdate = true;
      }
      mat.depthWrite = base.depthWrite && opacity > 0.85;
    });
    barrel.userData.machineHousingWeight = state.machineHousing;
  }

  function setExplode(amount, inspection = {}) {
    state.explode = clamp(amount);
    // Integrators may set both poses atomically, avoiding two opposing opacity
    // updates per frame when the three housings are held in their inspection lane.
    state.machineHousing = clamp(inspection.machineHousing ?? 0);
    state.machineHousingMobile = !!inspection.mobile;
    applyBarrelPlacement();
    applyPositions();
  }

  /** Call after setExplode. Weight 0 restores the Optics chapter's shell fade. */
  function setMachineHousing(weight, mobile = false) {
    state.machineHousing = clamp(weight);
    state.machineHousingMobile = !!mobile;
    applyBarrelPlacement();
  }

  function setAperture(fNumber) {
    state.fNumber = clamp(fNumber, 1.4, 16);
    state.apertureRadius = 1 / state.fNumber;
    const angle = Math.acos(
      clamp((state.apertureRadius - edgeOffset) / pivotRadius, -1, 1),
    );
    bladePivots.forEach((pivot) => {
      pivot.rotation.z = pivot.userData.baseAngle + angle;
    });
    iris.userData.fNumber = state.fNumber;
    iris.userData.apertureRadius = state.apertureRadius;
    iris.userData.bladeAngle = angle;
    return state.apertureRadius;
  }

  function setFocus(t) {
    state.focus = clamp(t);
    focusRing.rotation.z = (state.focus - 0.5) * 0.36;
    if (focusRing.userData.markingBand)
      focusRing.userData.markingBand.rotation.z = (state.focus - 0.5) * 0.36;
    applyPositions();
  }

  function sampleSurface(index, radialDistance, side = "front") {
    const spec = elementSpecs[index];
    if (!spec) return NaN;
    const front = side !== "back";
    return (
      elements[index].position.z +
      ((front ? 1 : -1) * spec.thickness) / 2 +
      sagAt(radialDistance, spec.radius, front ? spec.frontSag : spec.backSag)
    );
  }

  function surfaceNormal(
    index,
    x,
    y,
    side = "front",
    target = new THREE.Vector3(),
  ) {
    const spec = elementSpecs[index];
    if (!spec) return target.set(0, 0, 1);
    const front = side !== "back";
    const sag = front ? spec.frontSag : spec.backSag;
    const radius = Math.min(Math.hypot(x, y), spec.radius);
    const curvature = sphereRadius(spec.radius, sag);
    const denominator = Math.sqrt(
      Math.max(1e-9, curvature * curvature - radius * radius),
    );
    const derivative = (-Math.sign(sag) * radius) / denominator;
    const scale = radius > 1e-8 ? derivative / radius : 0;
    target.set(-scale * x, -scale * y, 1).normalize();
    if (!front) target.negate();
    return target;
  }

  function update(time = 0, progress = 0) {
    // Minute coating changes keep a held composition alive without moving an
    // optical element away from the geometry used by the ray system.
    const phase =
      (Number.isFinite(time) ? time : 0) * 0.17 + clamp(progress) * 0.5;
    glassMaterials.forEach((mat, index) => {
      mat.uniforms.uLife.value = phase + index * 0.31;
    });
    bladeSweepUniforms.forEach((uniform, index) => {
      uniform.value = 0.43 + Math.sin(phase * 0.42 + index * 0.51) * 0.18;
    });
  }

  function dispose() {
    if (state.disposed) return;
    state.disposed = true;
    instancedMeshes.forEach((resource) => resource.dispose());
    geometries.forEach((resource) => resource.dispose());
    materials.forEach((resource) => resource.dispose());
    textures.forEach((resource) => resource.dispose());
    group.removeFromParent();
    group.clear();
  }

  setAperture(1.4);
  setExplode(0);
  return {
    group,
    elements,
    elementSpecs,
    opticalGroups,
    iris,
    barrel,
    bladeMeshes,
    bladePivots,
    glassMaterials,
    setExplode,
    setMachineHousing,
    setAperture,
    setFocus,
    sampleSurface,
    surfaceNormal,
    update,
    dispose,
    get apertureRadius() {
      return state.apertureRadius;
    },
    get fNumber() {
      return state.fNumber;
    },
    get focus() {
      return state.focus;
    },
    get explode() {
      return state.explode;
    },
  };
}
