const fs = require('fs');
const content = fs.readFileSync('apps/backend/src/modules/orders/orders.service.ts', 'utf8');
const newContent = content.replace(
  /\} catch \(err\) \{\s*this\.logger\.error\('Error in getActiveCustomerOrder', err\);\s*return null;\s*\}/g,
  `} catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error('Error in getActiveCustomerOrder', err);
      throw new InternalServerErrorException('Failed to fetch active order');
    }`
);
fs.writeFileSync('apps/backend/src/modules/orders/orders.service.ts', newContent);
