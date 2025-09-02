// Global type declarations for the project

declare module "*.glb" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "meshline" {
  import { BufferGeometry, Material } from "three";

  export class MeshLineGeometry extends BufferGeometry {
    setPoints(points: THREE.Vector3[]): void;
  }

  export class MeshLineMaterial extends Material {
    constructor(options?: {
      color?: string | number;
      lineWidth?: number;
      map?: THREE.Texture;
      useMap?: boolean;
      repeat?: [number, number];
      resolution?: [number, number];
      depthTest?: boolean;
    });
  }
}

// Extend JSX IntrinsicElements for meshline components
declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshLineGeometry: Record<string, unknown>;
      meshLineMaterial: {
        color?: string;
        lineWidth?: number;
        map?: THREE.Texture;
        useMap?: boolean;
        repeat?: [number, number];
        resolution?: [number, number];
        depthTest?: boolean;
        [key: string]: unknown;
      };
    }
  }
}

export {};
