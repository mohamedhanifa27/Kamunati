const fs = require('fs');
let content = fs.readFileSync('src/components/admin/ReviewModerationTable.tsx', 'utf8');

content = content.replace(/fetch\(\/api\/admin\/review-reports\?reviewId=\)/, 'fetch(/api/admin/review-reports?reviewId=${reviewId})');
content = content.replace(/fetch\(\/api\/admin\/review-reports\/, \{/, 'fetch(/api/admin/review-reports/${reportId}, {');

content = content.replace(
  /<AlertCircle size=\{14\} \/> \{review\._count\.reports\} Flag Reports\s*<\/div>\s*<button onClick=\{\(\) => fetchReports\(review\.id\)\} className="text-xs text-white\/50 hover:text-white underline">View Reports<\/button>/g,
  '<AlertCircle size={14} /> {review._count.reports} Flag Reports</div><button onClick={() => fetchReports(review.id)} className="text-xs text-white/50 hover:text-white underline mt-1 block">View Reports</button></div>'
);

content = content.replace(
  /<div className="flex items-center gap-2 text-xs text-red-400 bg-red-500\/10 inline-flex px-2 py-1 rounded border border-red-500\/20">/g,
  '<div><div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 inline-flex px-2 py-1 rounded border border-red-500/20">'
);

fs.writeFileSync('src/components/admin/ReviewModerationTable.tsx', content);
