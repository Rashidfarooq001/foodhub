const fs = require('fs');
const file = 'apps/backend/src/modules/reviews/dto/reviews.dto.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /import \{ IsInt, Min, Max, IsUUID \} from 'class-validator';/,
  "import { IsInt, Min, Max, IsUUID, IsOptional, IsString, IsBoolean } from 'class-validator';"
);

code = code.replace(
  /rating!: number;\n\}/,
  "rating!: number;\n\n  @IsOptional()\n  @IsUUID()\n  restaurantId?: string;\n\n  @IsOptional()\n  @IsString()\n  comment?: string;\n\n  @IsOptional()\n  @IsBoolean()\n  isAnonymous?: boolean;\n}"
);

code = code.replace(
  /rating!: number;\n\}(?![\s\S]*rating!: number;\n\})/, // Replace the LAST occurrence of rating!: number; \n} which is CreateDriverReviewDto
  "rating!: number;\n\n  @IsOptional()\n  @IsUUID()\n  driverId?: string;\n\n  @IsOptional()\n  @IsString()\n  comment?: string;\n\n  @IsOptional()\n  @IsBoolean()\n  isAnonymous?: boolean;\n}"
);

fs.writeFileSync(file, code);
