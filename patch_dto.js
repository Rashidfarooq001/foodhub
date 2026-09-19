const fs = require('fs');
let txt = fs.readFileSync('apps/backend/src/modules/auth/dto/admin-login.dto.ts', 'utf8');
txt = txt.replace('export class AdminVerifySecurityQuestionsDto {', 'export class AdminVerifySecurityQuestionsDto {\n  @IsString()\n  @IsNotEmpty()\n  identifier!: string;\n');
if (!txt.includes('AdminVerifyIdentifierDto')) {
    txt += '\nexport class AdminVerifyIdentifierDto {\n  @IsString()\n  @IsNotEmpty()\n  identifier!: string;\n}\n';
}
fs.writeFileSync('apps/backend/src/modules/auth/dto/admin-login.dto.ts', txt);
