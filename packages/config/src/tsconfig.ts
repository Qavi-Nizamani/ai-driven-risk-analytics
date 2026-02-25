import type { CompilerOptions } from "typescript";
import { ModuleKind, ModuleResolutionKind, ScriptTarget } from "typescript";

export const baseTsConfig: CompilerOptions = {
  target: ScriptTarget.ES2020,
  module: ModuleKind.NodeNext,
  moduleResolution: ModuleResolutionKind.NodeNext,
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

