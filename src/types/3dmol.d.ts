declare module '3dmol' {
  export function createViewer(element: HTMLElement, config?: any): any;
  export function download(query: string, viewer: any, options?: any, callback?: (m: any) => void): void;
}
