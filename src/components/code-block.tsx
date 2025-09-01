"use client";

import { CodeBlock } from "@/components/ui/code-block";

export function CodeBlockDemo() {
  const sampleCode = `// Design tools that work with you
const createDesign = async () => {
  const canvas = new Canvas({
    width: 1920,
    height: 1080,
    background: 'gradient'
  });
  
  await canvas.addLayer({
    type: 'text',
    content: 'Beautiful Design',
    font: 'Inter',
    size: 48
  });
  
  return canvas.export('png');
};`;

  return (
    <div className="w-96">
      <CodeBlock
        language="javascript"
        filename="design-tools.js"
        code={sampleCode}
        highlightLines={[2, 8, 9, 10]}
      />
    </div>
  );
}
