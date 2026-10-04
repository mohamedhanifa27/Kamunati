const fs = require('fs');
let code = fs.readFileSync('src/features/admin/ui/threeui/ForkedAnimatedTopDock.tsx', 'utf8');

code = code.replace('axis: variant === "glass" ? "y" as const : "x" as const,', 'axis: optionsRef.current.axis || (variant === "glass" ? "y" as const : "x" as const),');

code = code.replace('export type AnimatedTopDockProps = {', 'export type AnimatedTopDockProps = {\n  axis?: "x" | "y";\n  activeId?: string;\n  onNavigate?: (id: string) => void;\n  collapsed?: boolean;\n  items?: readonly any[];');

code = code.replace('const [active, setActive] = useState(items[0].id);', 'const [localActive, setActive] = useState(items[0]?.id);\n  const active = props.activeId !== undefined ? props.activeId : localActive;');

code = code.replace('setActive(item.id);', 'if (props.onNavigate) { props.onNavigate(item.id); } else { setActive(item.id); }');

code = code.replace(/"\.\/topDockController"/g, '"./ForkedTopDockController"');
code = code.replace(/"\.\/retroPixelField"/g, '"../../../../vendor/threeui/src/shaders/animated-top-dock/retroPixelField"');
code = code.replace(/"\.\/glassParticleField"/g, '"../../../../vendor/threeui/src/shaders/animated-top-dock/glassParticleField"');

fs.writeFileSync('src/features/admin/ui/threeui/ForkedAnimatedTopDock.tsx', code);
