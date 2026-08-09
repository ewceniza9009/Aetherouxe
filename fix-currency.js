const fs = require('fs');

const files = [
  'apps/resident-web/src/pages/PaymentsPage.tsx',
  'apps/resident-web/src/pages/UtilityBillsPage.tsx',
  'apps/resident-web/src/pages/LeasePage.tsx',
  'apps/resident-web/src/pages/DashboardPage.tsx',
  'apps/resident-web/src/pages/RtoPage.tsx',
  'apps/resident-web/src/pages/MortgageScenarioPage.tsx',
  'apps/resident-web/src/pages/PaymentRemindersPage.tsx',
  'apps/resident-web/src/lib/utility-meta.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Add import
  if (!content.includes('formatCurrency')) {
    content = `import { formatCurrency } from '@elite-realty/shared-ui/lib/utils';\n` + content;
  }

  // PaymentsPage.tsx
  content = content.replace(/\$\{nextDue\.amount\.toLocaleString[^}]+\}/g, '{formatCurrency(nextDue.amount)}');
  content = content.replace(/\$\{inv\.amount\.toLocaleString[^}]+\}/g, '{formatCurrency(inv.amount)}');
  
  // UtilityBillsPage.tsx
  content = content.replace(/tickFormatter=\{\(val\) => `\$\$\{val\}`\}/g, 'tickFormatter={(val) => formatCurrency(val)}');
  content = content.replace(/`\$\$\{Number\(value\)\.toFixed\(2\)\}`/g, 'formatCurrency(value)');
  
  // LeasePage.tsx
  content = content.replace(/\$\{lease\.monthlyRent\.toLocaleString\(\)\}/g, '{formatCurrency(lease.monthlyRent)}');
  content = content.replace(/\$\{lease\.securityDeposit\?\.toLocaleString\(\) \?\? "—"\}/g, '{formatCurrency(lease.securityDeposit)}');
  content = content.replace(/\$\{\(\(lease\.monthlyRent \?\? 0\) \* 0\.25\)\.toLocaleString[^}]+\}/g, '{formatCurrency((lease.monthlyRent ?? 0) * 0.25)}');
  content = content.replace(/\$\{nextPayment\.amount\.toLocaleString[^}]+\}/g, '{formatCurrency(nextPayment.amount)}');
  content = content.replace(/\$\{sc\.monthlyPayment\.toLocaleString[^}]+\}/g, '{formatCurrency(sc.monthlyPayment)}');
  content = content.replace(/\$\{sc\.loanAmount\.toLocaleString\(\)\}/g, '{formatCurrency(sc.loanAmount)}');
  content = content.replace(/\$\{sc\.totalInterest\.toLocaleString\(\)\}/g, '{formatCurrency(sc.totalInterest)}');
  
  // DashboardPage.tsx
  content = content.replace(/\n\s*\$\n/g, '\n');
  content = content.replace(/Target: \$/g, 'Target: ');
  content = content.replace(/<span className="text-4xl font-bold">([^<]+)<\/span>/g, '<span className="text-4xl font-bold">{formatCurrency($1)}</span>');
  
  // RtoPage.tsx
  content = content.replace(/`\$\$\{Number\(n \?\? 0\)\.toLocaleString[^}]+\}`/g, 'formatCurrency(n)');
  content = content.replace(/tickFormatter=\{\(val\) => `\$\$\{val\}`\}/g, 'tickFormatter={(val) => formatCurrency(val)}');
  
  // MortgageScenarioPage.tsx
  content = content.replace(/`\$\$\{n\.toLocaleString[^}]+\}`/g, 'formatCurrency(n)');
  
  // utility-meta.ts
  content = content.replace(/`\$\$\{Number\(n \?\? 0\)\.toLocaleString[^}]+\}`/g, 'formatCurrency(n)');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
}
