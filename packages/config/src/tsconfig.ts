import type { CompilerOptions } from "typescript";

export const baseTsConfig: CompilerOptions = {
  target: "ES2020",
  module: "NodeNext",
  moduleResolution: "NodeNext",
  strict: true,
  esModuleInterop: true,
  forceConsistentCasingInFileNames: true,
  skipLibCheck: true,
  resolveJsonModule: true,
  allowSyntheticDefaultImports: true,
  noImplicitOverride: true,
  noUnusedLocals: true,
  noUnusedParameters: true,
  noFallthroughCasesInSwitch: true
};

