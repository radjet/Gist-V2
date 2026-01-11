import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Constants & Config ---

const GLOBE_RADIUS = 6;
const MAPBOX_TOKEN_DEFAULT = "pk.eyJ1IjoicmFkamV0IiwiYSI6ImNsZmRyZm10NjBtNzEzdG82MjIxZTc0Z3AifQ.vgXGJlkIxIc6tgu6G-HRag";

// --- Math Helpers ---

const DEG2RAD = Math.PI / 180;

/**
 * Converts tile X index to Longitude degrees.
 */
function tile2lon(x: number, z: number): number {
  return (x / Math.pow(2, z)) * 360 - 180;
}

/**
 * Converts tile Y index to Latitude degrees.
 */
function tile2lat(y: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
}

/**
 * Converts Lat/Lon to 3D Cartesian point on a sphere.
 */
function lonLatToVector3(lon: number, lat: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * DEG2RAD;
  const theta = (lon + 180) * DEG2RAD;

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

// --- Geometry Generators ---

/**
 * Creates a spherical patch geometry for a specific map tile.
 */
function createTileGeometry(x: number, y: number, z: number, radius: number): THREE.BufferGeometry | null {
  const geometry = new THREE.BufferGeometry();
  
  const segments = 32; 
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const lonLeft = tile2lon(x, z);
  const lonRight = tile2lon(x + 1, z);
  const latTop = tile2lat(y, z);
  const latBottom = tile2lat(y + 1, z);

  // Generate vertices and UVs
  for (let iv = 0; iv <= segments; iv++) {
    for (let iu = 0; iu <= segments; iu++) {
      const u = iu / segments;
      const v = iv / segments;

      // Interpolate Lat/Lon
      const lon = THREE.MathUtils.lerp(lonLeft, lonRight, u);
      const lat = THREE.MathUtils.lerp(latBottom, latTop, v);

      const pos = lonLatToVector3(lon, lat, radius);

      if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) {
        return null;
      }

      vertices.push(pos.x, pos.y, pos.z);

      // UVs
      uvs.push(u, v);
    }
  }

  // Generate Indices
  const cols = segments + 1;
  for (let iv = 0; iv < segments; iv++) {
    for (let iu = 0; iu < segments; iu++) {
      const a = iv * cols + iu;
      const b = iv * cols + (iu + 1);
      const c = (iv + 1) * cols + iu;
      const d = (iv + 1) * cols + (iu + 1);

      // Counter-clockwise winding
      indices.push(a, b, d);
      indices.push(d, c, a);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  if (geometry.attributes.position.count === 0) return null;

  return geometry;
}

/**
 * Creates a starfield using Points geometry.
 */
function createStarfield(count: number, radius: number): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const theta = 2 * Math.PI * Math.random();
    const phi = Math.acos(2 * Math.random() - 1);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.2,
    sizeAttenuation: true, 
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  
  return new THREE.Points(geometry, material);
}

// --- Atmosphere Shader ---

const atmosphereVertexShader = `
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const atmosphereFragmentShader = `
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  
  float viewDot = max(0.0, dot(normal, viewDir));
  float intensity = pow(0.5 - viewDot, 4.0); 
  intensity = clamp(intensity, 0.0, 1.0);
  
  vec3 glowColor = vec3(0.1, 0.5, 1.0); 
  
  gl_FragColor = vec4(glowColor, intensity * 0.8);
}
`;

// --- Main Scene Creator ---

export function createGlobeScene(container: HTMLElement) {
  const scene = new THREE.Scene();
  
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 4000);
  camera.position.set(12, 6, 20); 
  scene.add(camera);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace; 
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.minDistance = 8;
  controls.maxDistance = 50;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;
  controls.addEventListener('start', () => { controls.autoRotate = false; });

  const starfield = createStarfield(1800, 1600);
  scene.add(starfield);

  const tileGroup = new THREE.Group();
  scene.add(tileGroup);

  // --- Mapbox Logic ---

  function getMapboxToken(): string {
    if (typeof window !== 'undefined' && (window as any).__GIST_MAPBOX_TOKEN) {
      return (window as any).__GIST_MAPBOX_TOKEN as string;
    }
    return MAPBOX_TOKEN_DEFAULT;
  }

  const token = getMapboxToken();
  const TILE_SIZE = 256; // Standard tile size for web maps

  // --- Style Resolution ---
  const DEFAULT_STYLE_ID = "radjet/cmk9dscpw00o801s92wl50o7n";
  let activeStyleId = DEFAULT_STYLE_ID;

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const rawStyle = params.get('style');
    if (rawStyle) {
      // Strip mapbox://styles/ prefix if present
      const cleanStyle = rawStyle.replace('mapbox://styles/', '');
      // Validate structure: must contain '/' and start with allowed namespaces
      if (cleanStyle.includes('/') && (cleanStyle.startsWith('radjet/') || cleanStyle.startsWith('mapbox/'))) {
        activeStyleId = cleanStyle;
      } else {
        console.warn(`[Globe] Invalid style override ignored: ${rawStyle}`);
      }
    }
  }

  // Strict URL builder
  const getTileUrl = (z: number, x: number, y: number) => {
    const dpr = window.devicePixelRatio || 1;
    // Append @2x only if tileSize is 256 and DPR is > 1 (Retina support)
    const suffix = (TILE_SIZE === 256 && dpr > 1) ? '@2x' : '';
    
    return `https://api.mapbox.com/styles/v1/${activeStyleId}/tiles/${TILE_SIZE}/${z}/${x}/${y}${suffix}?access_token=${token}`;
  };

  // --- UI Feedback (Minimal) ---
  
  // On-screen Style Label
  const styleLabel = document.createElement('div');
  Object.assign(styleLabel.style, {
    position: 'absolute',
    top: '10px',
    left: '10px',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '10px',
    fontFamily: 'monospace',
    pointerEvents: 'none',
    zIndex: '9998' 
  });
  styleLabel.textContent = `Style: ${activeStyleId}`;
  container.appendChild(styleLabel);


  // --- Main Globe Tiles ---
  const ZOOM = 2;
  const TILE_COUNT = Math.pow(2, ZOOM);

  if (token) {
    for (let x = 0; x < TILE_COUNT; x++) {
      for (let y = 0; y < TILE_COUNT; y++) {
        const url = getTileUrl(ZOOM, x, y);
        
        const textureLoader = new THREE.TextureLoader();
        textureLoader.setCrossOrigin('anonymous');
        
        textureLoader.load(
          url,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.generateMipmaps = false; 
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.needsUpdate = true;
            
            const geometry = createTileGeometry(x, y, ZOOM, GLOBE_RADIUS);
            
            if (!geometry) return;
            
            const material = new THREE.MeshBasicMaterial({
              map: tex,
              side: THREE.DoubleSide,
              toneMapped: false, 
            });

            const mesh = new THREE.Mesh(geometry, material);
            tileGroup.add(mesh);
          },
          undefined,
          (err) => {
            console.warn(`Globe: Failed to load tile ${x},${y}`, err);
          }
        );
      }
    }
  }

  const atmoGeo = new THREE.SphereGeometry(GLOBE_RADIUS + 0.15, 64, 64);
  const atmoMat = new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    transparent: true,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
  scene.add(atmosphere);

  let animationId: number;
  const animate = () => {
    animationId = requestAnimationFrame(animate);
    controls.update();
    starfield.position.copy(camera.position);
    renderer.render(scene, camera);
  };
  animate();

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
  });
  resizeObserver.observe(container);

  return {
    cleanup: () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationId);
      controls.dispose();
      renderer.dispose();
      
      atmoGeo.dispose();
      atmoMat.dispose();
      
      starfield.geometry.dispose();
      if (starfield.material instanceof THREE.Material) starfield.material.dispose();

      if (styleLabel && container.contains(styleLabel)) {
        container.removeChild(styleLabel);
      }

      // Full cleanup of meshes/materials
      tileGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });
      scene.remove(tileGroup);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    }
  };
}