const fs = require('fs');
const files = [
  'x:/reps/apps/admin-web/src/pages/UtilityBillsPage.tsx',
  'x:/reps/apps/admin-web/src/pages/TitleTransfersPage.tsx',
  'x:/reps/apps/admin-web/src/pages/MetersPage.tsx',
  'x:/reps/apps/admin-web/src/pages/CommissionsPage.tsx',
  'x:/reps/apps/admin-web/src/pages/CollectionCasesPage.tsx',
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/<\/CardContent>\s*<\/Card>\s*(<ListPager[^>]+\/>)/g, "</CardContent>\n        $1\n      </Card>");
  fs.writeFileSync(f, content);
  console.log('Fixed', f);
});
