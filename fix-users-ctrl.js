const fs = require('fs');
const path = require('path');

const ctrlPath = path.join('apps', 'backend', 'src', 'modules', 'users', 'users.controller.ts');
let ctrlCode = fs.readFileSync(ctrlPath, 'utf8');

ctrlCode = ctrlCode.replace(
/async findAllCustomers\(\s*@Query\('limit'\) limit: string,\s*@Query\('search'\) search: string,\s*\) \{[\s\S]*?\}\s*\}/g,
`async findAllCustomers(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('status') status: string,
  ) {
    const l = limit ? parseInt(limit, 10) : 50;
    const p = page ? parseInt(page, 10) : 1;
    return this.usersService.findAllCustomers(p, l, search || '', status);
  }`
);

fs.writeFileSync(ctrlPath, ctrlCode);
console.log('Fixed backend users controller');
