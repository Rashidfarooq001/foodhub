const fs = require('fs');
const path = require('path');

const restCtrlPath = path.join('apps', 'backend', 'src', 'modules', 'restaurants', 'restaurants.controller.ts');
let restCtrlCode = fs.readFileSync(restCtrlPath, 'utf8');

restCtrlCode = restCtrlCode.replace(
/async findAll\([\s\S]*?\)\s*\{[\s\S]*?return this\.restaurantsService\.findAllRestaurants\(admin === 'true', userLat, userLng\);\s*\}/g,
`async findAll(
    @Query('admin') admin?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const userLat = lat ? parseFloat(lat) : undefined;
    const userLng = lng ? parseFloat(lng) : undefined;
    return this.restaurantsService.findAllRestaurants(
      admin === 'true',
      userLat,
      userLng,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      search,
      status
    );
  }`
);

fs.writeFileSync(restCtrlPath, restCtrlCode);
console.log('Fixed backend restaurants controller');
