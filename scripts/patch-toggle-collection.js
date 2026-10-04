const fs = require('fs');
let code = fs.readFileSync('src/features/admin/ui/threeui/ForkedSkeuomorphicToggleCollection.tsx', 'utf8');

code = code.replace(/"\.\/ModernToggle"/g, '"./ForkedModernToggle"');
code = code.replace(/"\.\.\/neuform-isolated\/NeuformBatchEffects"/g, '"../../../../vendor/threeui/src/shaders/neuform-isolated/NeuformBatchEffects"');
code = code.replace(/"\.\/GlassToggle"/g, '"../../../../vendor/threeui/src/shaders/skeuomorphic-toggle/GlassToggle"');
code = code.replace(/"\.\/ShaderToggle"/g, '"../../../../vendor/threeui/src/shaders/skeuomorphic-toggle/ShaderToggle"');

code = code.replace('export type SkeuomorphicToggleCollectionProps = {', 'export type SkeuomorphicToggleCollectionProps = {\n  checked?: boolean;\n  disabled?: boolean;\n  busy?: boolean;');

code = code.replace('<ModernToggle {...props} defaultOn={defaultOn} label={label} onChange={onChange} />', '<ModernToggle {...props} defaultOn={defaultOn} label={label} onChange={onChange} checked={props.checked} disabled={props.disabled} busy={props.busy} />');

fs.writeFileSync('src/features/admin/ui/threeui/ForkedSkeuomorphicToggleCollection.tsx', code);
