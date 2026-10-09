const fs = require('fs');

const files = [
  'src/app/settings/account/page.tsx',
  'src/components/admin/ReviewModerationTable.tsx',
  'src/components/admin/TMDBImportModal.tsx',
  'src/components/admin/UsersTable.tsx',
  'src/components/admin/editor/ArtworkTab.tsx',
  'src/components/admin/editor/DetailsTab.tsx',
  'src/components/admin/editor/MediaTab.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Add useNotification import if not present
  if (!content.includes('useNotification')) {
    const importMatch = content.match(/import [^;]+;/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      const importPath = file.includes('app/') ? '../../../components/ui/NotificationProvider' : '../../components/ui/NotificationProvider';
      // For editor tabs it might be different depth, let's just use absolute alias if possible or calculate it
      // we can just use '@/components/ui/NotificationProvider' if aliased, but wait, Kamunati uses relative imports.
      // src/components/admin/editor/ArtworkTab.tsx -> ../../ui/NotificationProvider
      let relPath = '';
      if (file.includes('editor')) { relPath = '../../ui/NotificationProvider'; }
      else if (file.includes('admin/')) { relPath = '../ui/NotificationProvider'; }
      else if (file.includes('settings/')) { relPath = '../../../components/ui/NotificationProvider'; }
      
      content = content.replace(lastImport, `${lastImport}\nimport { useNotification } from '${relPath}';`);
    }
  }

  // Insert const { notify } = useNotification(); inside the component
  const componentMatch = content.match(/export (default )?function ([a-zA-Z0-9_]+)\([^)]*\)\s*\{/);
  if (componentMatch && !content.includes('useNotification()')) {
    content = content.replace(componentMatch[0], `${componentMatch[0]}\n  const { notify } = useNotification();`);
  }

  // Replace alert('msg') with notify('Notification', 'msg', 'default')
  // We need to be careful with template literals and concatenation
  content = content.replace(/alert\((['"`])((?:✅ |❌ )?)(.*?)(['"`])\)/g, (match, q1, icon, text, q2) => {
    let variant = 'default';
    if (icon === '✅ ') variant = 'success';
    if (icon === '❌ ' || text.toLowerCase().includes('fail') || text.toLowerCase().includes('error')) variant = 'destructive';
    return `notify('${variant === 'success' ? 'Success' : variant === 'destructive' ? 'Error' : 'Notification'}', ${q1}${text}${q2}, '${variant}')`;
  });
  
  content = content.replace(/alert\(([^)]+)\)/g, (match, expr) => {
    if (match.includes('notify')) return match;
    let variant = 'default';
    if (expr.toLowerCase().includes('error') || expr.toLowerCase().includes('fail')) variant = 'destructive';
    return `notify('Notification', ${expr}, '${variant}')`;
  });

  // handle setToast in account page
  if (file.includes('account/page.tsx')) {
    content = content.replace(/setToast\(([^)]+)\)/g, "notify('Success', $1, 'success')");
    content = content.replace(/const \[toast, setToast\] = useState\(''\);/, "");
    content = content.replace(/setTimeout\(\(\) => notify\('Success', '', 'success'\), 3000\);/g, "");
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Processed ${file}`);
});
