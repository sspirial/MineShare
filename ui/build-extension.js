import { copyFile, mkdir, cp, readFile, writeFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function ensureDir(dir) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

async function postBuild() {
  console.log('Post-build: Copying extension files...');
  
  const distDir = join(__dirname, 'dist');
  
  // Create necessary directories
  await ensureDir(join(distDir, 'src'));
  await ensureDir(join(distDir, 'src/api'));
    await ensureDir(join(distDir, 'pages'));
  
  // Copy non-React source files
  console.log('Copying background and content scripts...');
  await copyFile(
    join(__dirname, 'src/background.js'),
    join(distDir, 'src/background.js')
  );
  await copyFile(
    join(__dirname, 'src/content_script.js'),
    join(distDir, 'src/content_script.js')
  );
  
  // Copy API files
  console.log('Copying API files...');
  await copyFile(
    join(__dirname, 'src/api/data_api.js'),
    join(distDir, 'src/api/data_api.js')
  );
  
  // Copy assets
  console.log('Copying assets...');
  await cp(join(__dirname, 'assets'), join(distDir, 'assets'), { recursive: true });
  
  // Copy manifest
  console.log('Copying manifest...');
  await copyFile(
    join(__dirname, 'manifest.json'),
    join(distDir, 'manifest.json')
  );
  
  // Rename HTML files
  console.log('Processing HTML files...');
  try {
    // Process popup.html
    await copyFile(
      join(distDir, 'src/pages/popup.html'),
      join(distDir, 'pages/popup.html')
    );
    
    // Process options.html
    await copyFile(
      join(distDir, 'src/pages/options.html'),
      join(distDir, 'pages/options.html')
    );
    
    console.log('HTML files processed successfully');
    
    // Clean up intermediate HTML files from dist/src/pages
    console.log('Cleaning up intermediate files...');
    await rm(join(distDir, 'src/pages'), { recursive: true, force: true });
  } catch (err) {
    console.error('Error processing HTML files:', err.message);
  }
  
  console.log('Post-build complete!');
}

postBuild().catch(err => {
  console.error('Post-build failed:', err);
  process.exit(1);
});
