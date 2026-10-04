const fs = require('fs');
let code = fs.readFileSync('src/features/admin/ui/threeui/ForkedModernToggle.tsx', 'utf8');

code = code.replace('export type ModernToggleProps = {', 'export type ModernToggleProps = {\n  checked?: boolean;\n  disabled?: boolean;\n  busy?: boolean;');

code = code.replace('const [on, setOn] = useState(defaultOn);', 'const [localOn, setOn] = useState(defaultOn);\n  const on = props.checked !== undefined ? props.checked : localOn;');

code = code.replace('}: ModernToggleProps) {', '...props\n}: ModernToggleProps) {');

code = code.replace('const toggle = useCallback(() => {\n    setOn((current) => {\n      onChange?.(!current);\n      return !current;\n    });\n  }, [onChange]);', 'const toggle = useCallback(() => {\n    if (props.disabled || props.busy) return;\n    if (props.checked === undefined) {\n      setOn((current) => {\n        onChange?.(!current);\n        return !current;\n      });\n    } else {\n      onChange?.(!props.checked);\n    }\n  }, [onChange, props.checked, props.disabled, props.busy]);');

code = code.replace('<button\n      ref={switchRef}\n      type="button"\n      role="switch"\n      aria-checked={on}\n      onClick={toggle}', '<button\n      ref={switchRef}\n      type="button"\n      role="switch"\n      aria-checked={on}\n      aria-disabled={props.disabled || props.busy}\n      disabled={props.disabled || props.busy}\n      onClick={toggle}');

code = code.replace('className={`threeui-modern-toggle${className ? ` ${className}` : ""}`}', 'className={`threeui-modern-toggle${className ? ` ${className}` : ""}${props.disabled ? " opacity-50 cursor-not-allowed" : ""}${props.busy ? " animate-pulse cursor-wait" : ""}`}');

code = code.replace(/"\.\/modern-toggle\.css"/g, '"../../../../vendor/threeui/src/shaders/skeuomorphic-toggle/modern-toggle.css"');
code = code.replace(/"\.\/toggleMode"/g, '"../../../../vendor/threeui/src/shaders/skeuomorphic-toggle/toggleMode"');

fs.writeFileSync('src/features/admin/ui/threeui/ForkedModernToggle.tsx', code);
