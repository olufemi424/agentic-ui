declare module 'fs' {
  export const promises: any
}

declare module 'path' {
  export function join(...args: any[]): string
  const _default: any
  export default _default
}

declare module 'os' {
  export function tmpdir(): string
  const _default: any
  export default _default
}

declare var process: any
