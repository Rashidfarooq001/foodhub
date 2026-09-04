const fs = require('fs');
let c = fs.readFileSync('apps/customer-web/src/components/home/CategoryCarousel.tsx', 'utf8');

c = c.replace(
  'export const CategoryCarousel: React.FC<Props> = ({ selectedCategory, onSelectCategory }) => {',
  'export const CategoryCarousel: React.FC<Props & { initialCategories?: any[] }> = ({ selectedCategory, onSelectCategory, initialCategories = [] }) => {'
);

c = c.replace(
  'const [categories, setCategories] = useState<CategoryData[]>([]);',
  'const [categories, setCategories] = useState<CategoryData[]>(initialCategories);'
);

fs.writeFileSync('apps/customer-web/src/components/home/CategoryCarousel.tsx', c);
