const fs = require('fs');
const path = 'apps/customer-web/src/components/tracking/OrderTimeline.tsx';
let content = fs.readFileSync(path, 'utf8');

const newRender = `  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">Live Delivery Progress</h3>

      <div className="relative flex flex-col gap-4 py-2">
        {/* Vertical Progress Bar Background */}
        <div className="absolute left-[17px] top-4 bottom-4 w-[2px] bg-gray-200" />
        <div
          className="absolute left-[17px] top-4 w-[2px] bg-orange-600 transition-all duration-500"
          style={{ height: \`\${(currentIndex / (STEPS.length - 1)) * 100}%\` }}
        />

        {/* Step Nodes */}
        {STEPS.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className={\`relative z-10 flex items-center gap-4 transition-opacity \${idx > currentIndex + 1 ? 'opacity-30' : 'opacity-100'}\`}>
              <div
                className={\`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all \${
                  isDone
                    ? 'border-orange-600 bg-orange-600 text-white shadow-md'
                    : 'border-gray-300 bg-white text-gray-400'
                } \${isCurrent ? 'ring-4 ring-orange-200' : ''}\`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={\`text-xs font-bold leading-tight \${
                  isDone ? 'text-gray-900' : 'text-gray-400'
                } \${isCurrent ? 'text-sm text-orange-700' : ''}\`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );`;

content = content.replace(/return \([\s\S]*?\);/, newRender);
fs.writeFileSync(path, content, 'utf8');
