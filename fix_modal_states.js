const fs = require('fs');
let content = fs.readFileSync('apps/customer-web/src/app/orders/[id]/page.tsx', 'utf8');

content = content.replace(/const \[supportIssue, setSupportIssue\] = useState\('Missing item'\);\r?\n/, '');
content = content.replace(/const \[supportDescription, setSupportDescription\] = useState\(''\);\r?\n/, '');
content = content.replace(/const \[supportSuccessMsg, setSupportSuccessMsg\] = useState<string \| null>\(null\);\r?\n/, '');
content = content.replace(/const \[isSubmittingSupport, setIsSubmittingSupport\] = useState\(false\);\r?\n/, '');

const handleSubmitSupportRegex = /const handleSubmitSupport = async \(\) => \{[\s\S]*?setIsSubmittingSupport\(false\);\s*\}\s*\};\r?\n/;
content = content.replace(handleSubmitSupportRegex, '');

fs.writeFileSync('apps/customer-web/src/app/orders/[id]/page.tsx', content);
console.log("Cleaned up states");
