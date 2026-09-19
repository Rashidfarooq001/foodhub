const fs = require('fs');
let txt = fs.readFileSync('apps/backend/src/modules/auth/auth.controller.ts', 'utf8');
const newRoute = \
  @Public()
  @Post('admin/verify-identifier')
  @HttpCode(HttpStatus.OK)
  async verifyAdminIdentifier(@Body() dto: AdminVerifyIdentifierDto) {
    return this.authService.verifyAdminIdentifier(dto.identifier);
  }
\;
txt = txt.replace('async verifyAdminSecurityQuestions(', newRoute + '\n  async verifyAdminSecurityQuestions(');
fs.writeFileSync('apps/backend/src/modules/auth/auth.controller.ts', txt);
