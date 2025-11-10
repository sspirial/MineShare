import { copyFile, mkdir, cp, readFile, writeFile } from 'fs/promises';
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
  await ensureDir(join(distDir, 'src/ui'));
  
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
    join(__dirname, 'src/api/marketplace.js'),
    join(distDir, 'src/api/marketplace.js')
  );
  await copyFile(
    join(__dirname, 'src/api/walrus.js'),
    join(distDir, 'src/api/walrus.js')
  );
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
  
  // Rename HTML files and inject API scripts
  console.log('Processing HTML files...');
  try {
    // Process popup.html
    let popupHtml = await readFile(join(distDir, 'src/ui/popup-new.html'), 'utf-8');
    // Inject API scripts before the React app script
    popupHtml = popupHtml.replace(
      '<script type="module" crossorigin',
      '<script src="../api/walrus.js"></script>\n    <script src="../api/marketplace.js"></script>\n    <script type="module" crossorigin'
    );
    await writeFile(join(distDir, 'src/ui/popup.html'), popupHtml);
    
    // Process options.html
    let optionsHtml = await readFile(join(distDir, 'src/ui/options-new.html'), 'utf-8');
    optionsHtml = optionsHtml.replace(
      '<script type="module" crossorigin',
      '<script src="../api/walrus.js"></script>\n    <script src="../api/marketplace.js"></script>\n    <script type="module" crossorigin'
    );
    await writeFile(join(distDir, 'src/ui/options.html'), optionsHtml);
    
    console.log('HTML files processed successfully');
  } catch (err) {
    console.error('Error processing HTML files:', err.message);
  }
  
  console.log('Post-build complete!');
}

postBuild().catch(err => {
  console.error('Post-build failed:', err);
  process.exit(1);
});
