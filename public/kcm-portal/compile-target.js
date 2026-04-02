/**
 * Compile an image into a MindAR .mind target file.
 *
 * Usage:
 *   node compile-target.js <input-image> [output-path]
 *
 * Examples:
 *   node compile-target.js assets/targets/test-target.jpg
 *   node compile-target.js my-marker.jpg assets/targets/custom.mind
 *
 * Requires: npm install mind-ar canvas sharp
 */

const { writeFileSync } = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

async function compile() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: node compile-target.js <input-image> [output.mind]');
    process.exit(1);
  }

  const outputPath = process.argv[3] || inputPath.replace(/\.[^.]+$/, '.mind');
  const absInput = path.resolve(inputPath);
  const absOutput = path.resolve(outputPath);

  console.log(`Compiling: ${absInput}`);
  console.log(`Output:    ${absOutput}`);

  // Dynamic import for ESM module
  const { OfflineCompiler } = await import('mind-ar/src/image-target/offline-compiler.js');

  const compiler = new OfflineCompiler();

  // Load image and pre-render onto a Canvas object.
  // MindAR's compiler calls drawImage(img, ...) on the process canvas context.
  // node-canvas drawImage accepts both Image and Canvas. But if there's a version
  // mismatch between our canvas import and mind-ar's, passing a Canvas is safer.
  const rawImg = await loadImage(absInput);
  const img = createCanvas(rawImg.width, rawImg.height);
  const imgCtx = img.getContext('2d');
  imgCtx.drawImage(rawImg, 0, 0);
  console.log(`Image: ${img.width}x${img.height}`);

  // Compile
  await compiler.compileImageTargets([img], (progress) => {
    process.stdout.write(`\r  Progress: ${Math.round(progress)}%  `);
  });

  // Export to .mind binary
  const buffer = compiler.exportData();
  writeFileSync(absOutput, Buffer.from(buffer));
  console.log(`\nDone! Wrote: ${absOutput} (${(Buffer.from(buffer).length / 1024).toFixed(1)} KB)`);
}

compile().catch(err => {
  console.error('\nCompilation error:', err.message);
  console.log('');
  console.log('If this fails, use the online compiler instead:');
  console.log('  1. Go to: https://hiukim.github.io/mind-ar-js-doc/quick-start/compile');
  console.log('  2. Upload your target image');
  console.log('  3. Download the .mind file');
  console.log('  4. Save it to assets/targets/');
  process.exit(1);
});
