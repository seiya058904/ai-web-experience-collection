import * as THREE from 'three';

/** A photographic black studio with three strip boxes and a low rear fill, stored as HDR. */
export function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(.008, .009, .0085);
  const cards: THREE.Mesh[] = [];
  const card = (width: number, height: number, x: number, y: number, z: number,
    r: number, g: number, b: number) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), toneMapped: false, side: THREE.DoubleSide }));
    mesh.position.set(x, y, z); mesh.lookAt(0, 0, 0); studio.add(mesh); cards.push(mesh);
  };
  card(7.8, 1.65, 0, -5.5, 3.3, 7.2, 6.9, 6.2);
  card(.74, 7.0, -4.8, 1.3, 3.0, 8.3, 9.0, 9.6);
  card(6.0, .82, 2.0, -5.8, -.4, 5.0, 5.0, 4.8);
  // Vertical spring walls see behind the movement; a broad low fill lets the
  // steel read without washing out the front-facing bridges or graphite plate.
  card(5.5, 6.0, 0, 1.5, -6.0, 2.3, 2.5, 2.55);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(studio, .018, .1, 40);
  cards.forEach(mesh => { mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose(); });
  pmrem.dispose();
  return target;
}
