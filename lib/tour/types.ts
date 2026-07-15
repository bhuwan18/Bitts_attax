// Shape of the guided-help tours. A tour is a plain data config (same spirit as
// the resolveHeroCta ladder in lib/home/heroCta.ts) so adding a walkthrough for
// another tab later is a config change, not new engine code.

export type TourPlacement = "top" | "bottom" | "left" | "right" | "auto";

export interface TourStep {
  id: string;
  // The `data-tour` attribute value to spotlight. Omit for a step that has no
  // anchor — it renders as a centered modal. A step whose target can't be found
  // on screen (empty list, a conditionally-rendered action) also falls back to
  // the centered modal, so a tour can never get stuck on a missing element.
  target?: string;
  title: string;
  body: string;
  placement?: TourPlacement;
}

export interface TourDefinition {
  id: string;
  steps: TourStep[];
}
