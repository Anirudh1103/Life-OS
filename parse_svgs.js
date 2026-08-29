const fs = require('fs');
const path = require('path');

const srcDir = 'd:/Projects/Life-OS/src';
const outputFilePath = path.join(srcDir, 'components/SvgIcons.tsx');

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.svg'));

let content = `import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

`;

files.forEach(file => {
  const name = path.basename(file, '.svg');
  // Convert kebab-case to PascalCase (e.g. overview-tasks -> OverviewTasksIcon)
  const componentName = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') + 'Icon';

  const svgContent = fs.readFileSync(path.join(srcDir, file), 'utf8');

  // Clean the SVG tag to allow styling with className and size
  let innerContent = svgContent
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '')
    .trim();

  // Replace any attributes for React compatibility
  innerContent = innerContent
    .replace(/stroke-width/g, 'strokeWidth')
    .replace(/stroke-linecap/g, 'strokeLinecap')
    .replace(/stroke-linejoin/g, 'strokeLinejoin')
    .replace(/fill-rule/g, 'fillRule')
    .replace(/clip-rule/g, 'clipRule');

  // Extract original viewBox if present, otherwise default to "0 0 24 24"
  const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';

  content += `export const ${componentName}: React.FC<IconProps> = ({ className, size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="${viewBox}"
    fill="none"
    className={className}
    {...props}
  >
    ${innerContent}
  </svg>
);

`;
});

fs.writeFileSync(outputFilePath, content);
console.log('Successfully generated SvgIcons.tsx at ' + outputFilePath);
