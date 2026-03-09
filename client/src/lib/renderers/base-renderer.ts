import { DashboardSpec } from '../dashboard-spec';
import { BaseRenderer, RenderContext, RenderResult, RenderInstruction } from './types';
import { translateLayout } from './layout-translator';

export abstract class AbstractDashboardRenderer implements BaseRenderer {
  protected context: RenderContext | null = null;
  protected instructions: RenderInstruction[] = [];

  async initialize(context: RenderContext): Promise<void> {
    this.context = context;
    
    // Convert the 12-col responsive spec layout into absolute/relative render instructions
    this.instructions = translateLayout(context.spec);
    
    await this.setupEnvironment();
  }

  /**
   * Format-specific environment setup (e.g., initializing a workbook or PDF document)
   */
  protected abstract setupEnvironment(): Promise<void>;

  /**
   * Renders all widgets based on the generated instructions
   */
  protected abstract renderWidgets(): Promise<void>;

  /**
   * Finalizes the rendering process and packages the output
   */
  protected abstract finalize(): Promise<RenderResult>;

  async render(): Promise<RenderResult> {
    if (!this.context) {
      throw new Error("Renderer not initialized");
    }

    try {
      await this.renderWidgets();
      return await this.finalize();
    } catch (error: any) {
      return {
        success: false,
        output: null,
        errors: [error.message || "Unknown rendering error"]
      };
    }
  }
}