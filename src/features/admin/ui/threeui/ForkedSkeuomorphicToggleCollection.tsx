import { lazy, Suspense, type CSSProperties } from "react";

import type { ToggleModePreference } from "./toggleMode";

export const SKEUOMORPHIC_TOGGLE_VARIANTS = [
  "skeuomorphic-toggle",
  "modern",
  "glass",
  "shader",
] as const;

export type SkeuomorphicToggleVariant = (typeof SKEUOMORPHIC_TOGGLE_VARIANTS)[number];

export type SkeuomorphicToggleCollectionProps = {
  checked?: boolean;
  disabled?: boolean;
  busy?: boolean;
  variant?: SkeuomorphicToggleVariant;
  mode?: ToggleModePreference;
  defaultOn?: boolean;
  label?: string;
  speed?: number;
  size?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  onChange?: (on: boolean) => void;
  className?: string;
  style?: CSSProperties;
};

/* The packaged Neuform export stays exactly as it shipped; the three companion
   treatments are first-party React renderers. */
const PackagedToggle = lazy(() =>
  import("../../../../vendor/threeui/src/shaders/neuform-isolated/NeuformBatchEffects").then((module) => ({ default: module.SkeuomorphicToggle })),
);

const ModernToggle = lazy(() =>
  import("./ForkedModernToggle").then((module) => ({ default: module.ModernToggle })),
);

const GlassToggle = lazy(() =>
  import("../../../../vendor/threeui/src/shaders/skeuomorphic-toggle/GlassToggle").then((module) => ({ default: module.GlassToggle })),
);

const ShaderToggle = lazy(() =>
  import("../../../../vendor/threeui/src/shaders/skeuomorphic-toggle/ShaderToggle").then((module) => ({ default: module.ShaderToggle })),
);

const FALLBACK = <div className="threeui-background skeuomorphic-toggle-variant" />;

export function SkeuomorphicToggleCollection({
  variant = "skeuomorphic-toggle",
  onChange,
  defaultOn,
  label,
  speed,
  ...props
}: SkeuomorphicToggleCollectionProps) {
  if (variant === "modern") {
    return (
      <Suspense fallback={FALLBACK}>
        <ModernToggle {...props} defaultOn={defaultOn} label={label} onChange={onChange} checked={props.checked} disabled={props.disabled} busy={props.busy} />
      </Suspense>
    );
  }

  if (variant === "glass") {
    return (
      <Suspense fallback={FALLBACK}>
        <GlassToggle {...props} defaultOn={defaultOn} label={label} speed={speed} onChange={onChange} />
      </Suspense>
    );
  }

  if (variant === "shader") {
    return (
      <Suspense fallback={FALLBACK}>
        <ShaderToggle {...props} defaultOn={defaultOn} label={label} speed={speed} onChange={onChange} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={FALLBACK}>
      <PackagedToggle {...props} speed={speed} />
    </Suspense>
  );
}
