const fs = require('fs');
const path = '/root/zayka-backend/src/modules/auth/auth.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const ctrlStr = `  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login using two separate numeric passwords' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async adminLogin(@Body() dto: AdminTwoPasswordLoginDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.authService.adminTwoPasswordLogin(dto, ip, ua);
  }`;

const newCtrlStr = `  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login using two separate numeric passwords' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async adminLogin(@Body() dto: AdminTwoPasswordLoginDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.authService.adminTwoPasswordLogin(dto, ip, ua);
  }

  @Post('admin/login/verify-otp')
  @HttpCode(HttpStatus.OK)
  async adminLoginVerifyOtp(@Body() dto: any, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.authService.adminTwoPasswordVerifyOtp(dto, ip, ua);
  }

  @Post('admin/login/resend-otp')
  @HttpCode(HttpStatus.OK)
  async adminLoginResendOtp(@Body() dto: any) {
    return this.authService.adminTwoPasswordResendOtp(dto);
  }`;

if (code.includes(ctrlStr)) {
  fs.writeFileSync(path, code.replace(ctrlStr, newCtrlStr));
  console.log('Replaced controller successfully');
} else {
  console.log('Controller Target string not found!');
}
