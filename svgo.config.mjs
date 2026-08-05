/**
 * Shared SVGO config for cleaning submitted logos.
 *
 *   npx svgo --config svgo.config.mjs -r entities/
 *
 * The settings are deliberately conservative: brand marks are held to a higher
 * fidelity bar than generic icons, so nothing here alters geometry in a way
 * that could visibly distort a logo.
 */
export default {
  multipass: true,
  js2svg: { indent: 2, pretty: true },
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // viewBox is required by validate.mjs — removing it breaks scaling.
          removeViewBox: false,
          // Keep ids: some brand SVGs reference them from gradients and masks.
          cleanupIds: false,
          // 3 decimal places keeps curves smooth on large renders.
          cleanupNumericValues: { floatPrecision: 3 },
          convertPathData: { floatPrecision: 3 },
          // Merging paths can change fill-rule rendering on complex marks.
          mergePaths: false,
        },
      },
    },
    'removeDimensions',
    'sortAttrs',
    {
      name: 'removeAttrs',
      params: { attrs: '(data-name|class|xmlns:xlink)' },
    },
  ],
};
