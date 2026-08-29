const fs = require('fs');
const path = require('path');

const srcDir = 'd:/Projects/Life-OS/src';
const destDir = 'd:/Projects/Life-OS/android/app/src/main/res/drawable';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.svg'));

files.forEach(file => {
  const name = path.basename(file, '.svg');
  // Android drawable names should be lowercase with underscores (e.g. overview-tasks -> ic_overview_tasks)
  const drawableName = 'ic_' + name.replace(/-/g, '_');
  const destPath = path.join(destDir, drawableName + '.xml');

  const svgContent = fs.readFileSync(path.join(srcDir, file), 'utf8');

  // Parse viewBox
  const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';
  const [, , vbWidth, vbHeight] = viewBox.split(' ').map(parseFloat);

  // Extract all <path>, <circle>, <rect> tags
  // We can use a simple regex matching loop
  let pathsXml = '';

  // Match <path .../> or <path ...></path>
  const pathRegex = /<path([^>]+)\/?>/g;
  let match;
  while ((match = pathRegex.exec(svgContent)) !== null) {
    const attrs = match[1];
    const dMatch = attrs.match(/d="([^"]+)"/);
    if (!dMatch) continue;

    const strokeMatch = attrs.match(/stroke="([^"]+)"/);
    const fillMatch = attrs.match(/fill="([^"]+)"/);
    const strokeWidthMatch = attrs.match(/stroke-width="([^"]+)"/);
    const strokeLinecapMatch = attrs.match(/stroke-linecap="([^"]+)"/);
    const strokeLinejoinMatch = attrs.match(/stroke-linejoin="([^"]+)"/);

    let pathXml = '  <path\n';
    pathXml += `      android:pathData="${dMatch[1]}"\n`;

    if (fillMatch && fillMatch[1] !== 'none') {
      pathXml += `      android:fillColor="${fillMatch[1]}"\n`;
    } else {
      // Default to transparent if fill is none or not specified for stroke paths
      pathXml += `      android:fillColor="#00000000"\n`;
    }

    if (strokeMatch && strokeMatch[1] !== 'none') {
      pathXml += `      android:strokeColor="${strokeMatch[1] === 'currentColor' ? '#FFFFFF' : strokeMatch[1]}"\n`;
      const sw = strokeWidthMatch ? strokeWidthMatch[1] : '1.0';
      pathXml += `      android:strokeWidth="${sw}"\n`;

      if (strokeLinecapMatch) {
        pathXml += `      android:strokeLineCap="${strokeLinecapMatch[1]}"\n`;
      }
      if (strokeLinejoinMatch) {
        pathXml += `      android:strokeLineJoin="${strokeLinejoinMatch[1]}"\n`;
      }
    }

    pathXml = pathXml.trimEnd().substring(0, pathXml.length - 1) + '/>\n';
    pathsXml += pathXml;
  }

  // Match <circle .../>
  const circleRegex = /<circle([^>]+)\/?>/g;
  while ((match = circleRegex.exec(svgContent)) !== null) {
    const attrs = match[1];
    const cxMatch = attrs.match(/cx="([^"]+)"/);
    const cyMatch = attrs.match(/cy="([^"]+)"/);
    const rMatch = attrs.match(/r="([^"]+)"/);
    if (!cxMatch || !cyMatch || !rMatch) continue;

    const cx = parseFloat(cxMatch[1]);
    const cy = parseFloat(cyMatch[1]);
    const r = parseFloat(rMatch[1]);

    const strokeMatch = attrs.match(/stroke="([^"]+)"/);
    const fillMatch = attrs.match(/fill="([^"]+)"/);
    const strokeWidthMatch = attrs.match(/stroke-width="([^"]+)"/);

    // Represent circle as a pathData: M cx-r, cy a r,r 0 1,0 r*2,0 a r,r 0 1,0 -r*2,0
    const d = `M ${cx - r},${cy} a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;

    let circleXml = '  <path\n';
    circleXml += `      android:pathData="${d}"\n`;

    if (fillMatch && fillMatch[1] !== 'none') {
      circleXml += `      android:fillColor="${fillMatch[1]}"\n`;
    } else {
      circleXml += `      android:fillColor="#00000000"\n`;
    }

    if (strokeMatch && strokeMatch[1] !== 'none') {
      circleXml += `      android:strokeColor="${strokeMatch[1] === 'currentColor' ? '#FFFFFF' : strokeMatch[1]}"\n`;
      const sw = strokeWidthMatch ? strokeWidthMatch[1] : '1.0';
      circleXml += `      android:strokeWidth="${sw}"\n`;
    }

    circleXml = circleXml.trimEnd().substring(0, circleXml.length - 1) + '/>\n';
    pathsXml += circleXml;
  }

  // Match <rect .../>
  const rectRegex = /<rect([^>]+)\/?>/g;
  while ((match = rectRegex.exec(svgContent)) !== null) {
    const attrs = match[1];
    const xMatch = attrs.match(/x="([^"]+)"/) || { 1: '0' };
    const yMatch = attrs.match(/y="([^"]+)"/) || { 1: '0' };
    const wMatch = attrs.match(/width="([^"]+)"/);
    const hMatch = attrs.match(/height="([^"]+)"/);
    if (!wMatch || !hMatch) continue;

    const x = parseFloat(xMatch[1]);
    const y = parseFloat(yMatch[1]);
    const w = parseFloat(wMatch[1]);
    const h = parseFloat(hMatch[1]);

    const rxMatch = attrs.match(/rx="([^"]+)"/);

    const strokeMatch = attrs.match(/stroke="([^"]+)"/);
    const fillMatch = attrs.match(/fill="([^"]+)"/);
    const strokeWidthMatch = attrs.match(/stroke-width="([^"]+)"/);

    // Represent rect as a pathData
    let d = '';
    if (rxMatch) {
      const rx = parseFloat(rxMatch[1]);
      d = `M ${x + rx},${y} h ${w - 2 * rx} a ${rx},${rx} 0 0 1 ${rx},${rx} v ${h - 2 * rx} a ${rx},${rx} 0 0 1 -${rx},${rx} h -${w - 2 * rx} a ${rx},${rx} 0 0 1 -${rx},-${rx} v -${h - 2 * rx} a ${rx},${rx} 0 0 1 ${rx},-${rx} Z`;
    } else {
      d = `M ${x},${y} h ${w} v ${h} h -${w} Z`;
    }

    let rectXml = '  <path\n';
    rectXml += `      android:pathData="${d}"\n`;

    if (fillMatch && fillMatch[1] !== 'none') {
      rectXml += `      android:fillColor="${fillMatch[1]}"\n`;
    } else {
      rectXml += `      android:fillColor="#00000000"\n`;
    }

    if (strokeMatch && strokeMatch[1] !== 'none') {
      rectXml += `      android:strokeColor="${strokeMatch[1] === 'currentColor' ? '#FFFFFF' : strokeMatch[1]}"\n`;
      const sw = strokeWidthMatch ? strokeWidthMatch[1] : '1.0';
      rectXml += `      android:strokeWidth="${sw}"\n`;
    }

    rectXml = rectXml.trimEnd().substring(0, rectXml.length - 1) + '/>\n';
    pathsXml += rectXml;
  }

  // Create Vector XML Content
  const vectorXml = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="${vbWidth || 24}dp"
    android:height="${vbHeight || 24}dp"
    android:viewportWidth="${vbWidth || 24}"
    android:viewportHeight="${vbHeight || 24}">
${pathsXml}</vector>
`;

  fs.writeFileSync(destPath, vectorXml);
});

console.log('Successfully converted ' + files.length + ' SVGs to Android Vector Drawables.');
