import { DashboardSpec } from '../dashboard-spec';
import { RenderInstruction } from './types';

/**
 * Translates the 12-column React-Grid-Layout responsive spec
 * into standardized rendering instructions (useful for Excel, PDF, etc.)
 */
export function translateLayout(spec: DashboardSpec): RenderInstruction[] {
  // We'll base the rendering primarily on the desktop (lg) layout
  const BASE_CELL_WIDTH = 100; // arbitrary units for renderer
  const BASE_CELL_HEIGHT = 80;

  return spec.widgets.map((widget) => {
    // Fallback to other breakpoints if lg is missing
    const layout = widget.layout.lg || widget.layout.md || widget.layout.sm;
    
    if (!layout) {
      console.warn(`Widget ${widget.id} is missing layout data. Skipping translation.`);
      return null;
    }

    return {
      widgetId: widget.id,
      type: widget.chartType || widget.type,
      data: null, // Data hydration happens in the renderer initialization phase
      bounds: {
        x: layout.x * BASE_CELL_WIDTH,
        y: layout.y * BASE_CELL_HEIGHT,
        width: layout.w * BASE_CELL_WIDTH,
        height: layout.h * BASE_CELL_HEIGHT
      },
      style: {
        preset: widget.stylePreset || 'soft',
        badgeColor: widget.badgeColor || 'default'
      }
    };
  }).filter(Boolean) as RenderInstruction[];
}