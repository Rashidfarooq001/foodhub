const fs = require('fs');
let content = fs.readFileSync('apps/backend/src/modules/auth/auth.service.ts', 'utf8');

const target = `    const cleanDigits = dto.phone.replace(/\\D/g, '');
    if (cleanDigits.length < 10) {
      throw new BadRequestException('Please provide a valid 10-digit mobile number');
    }
    const formattedPhone = cleanDigits.length === 10 ? \`+91\${cleanDigits}\` : \`+\${cleanDigits}\`;`;

const target2 = `    const cleanDigits = dto.phone.replace(/\\D/g, '');
    if (cleanDigits.length < 10) {
      throw new BadRequestException('Please provide a valid 10-digit mobile number');
    }

    const formattedPhone = cleanDigits.length === 10 ? \`+91\${cleanDigits}\` : \`+\${cleanDigits}\`;`;

const replacement = `    let formattedPhone: string;
    try {
      formattedPhone = normalizeIndianPhone(dto.phone);
    } catch {
      throw new BadRequestException('Please provide a valid 10-digit mobile number');
    }`;

content = content.split(target).join(replacement);
content = content.split(target2).join(replacement);

fs.writeFileSync('apps/backend/src/modules/auth/auth.service.ts', content);
