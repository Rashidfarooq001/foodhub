const fs = require('fs');
const file = 'apps/customer-web/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const splitMarker = 'ROW 6: RECOMMENDED FOR YOU (DYNAMIC)';
const parts = content.split(splitMarker);
if (parts.length === 2 && !content.includes('<DesktopSidebar')) {
  // we want to split right before the {/* ?? ROW 6
  // let's find the index of `{/* ` before parts[1]
  const beforeMarker = parts[0].lastIndexOf('{/*');
  const part1 = parts[0].substring(0, beforeMarker);
  const commentStart = parts[0].substring(beforeMarker);

  content =
    part1 +
    '        {/* DESKTOP LAYOUT WRAPPER */}\n' +
    '        <div className="flex flex-col md:flex-row md:gap-8 mt-6 md:mt-10">\n' +
    '          {/* Desktop Sidebar Filters */}\n' +
    '          <aside className="hidden md:block w-[240px] shrink-0">\n' +
    '            <DesktopSidebar\n' +
    '              filters={filters}\n' +
    '              setFilters={setFilters}\n' +
    '              onClearAll={handleClearAllFilters}\n' +
    '              hasActiveFilters={hasAnyFilterActive}\n' +
    '              activeCount={activeFiltersCount}\n' +
    '            />\n' +
    '          </aside>\n' +
    '          {/* Main Content Area */}\n' +
    '          <div className="flex-1 min-w-0">\n' +
    '            ' +
    commentStart +
    splitMarker +
    parts[1];

  const modalMarker = '{/* Location Selection Modal (GPS / Search / Saved) */}';
  const finalParts = content.split(modalMarker);
  content =
    finalParts[0] + '          </div>\n        </div>\n\n      ' + modalMarker + finalParts[1];

  fs.writeFileSync(file, content, 'utf8');
  console.log('patched');
}
