const fs = require('fs');
const file = 'apps/customer-web/src/components/tracking/LiveTrackingMap.tsx';
let content = fs.readFileSync(file, 'utf8');
const oldStr = "map.addListener('load', addOverlays);";
const newStr = "        let overlayAdded = false;\n" +
"        const safeAddOverlays = () => {\n" +
"          if (overlayAdded) return;\n" +
"          overlayAdded = true;\n" +
"          addOverlays();\n" +
"        };\n\n" +
"        if (map.isStyleLoaded && map.isStyleLoaded()) {\n" +
"          safeAddOverlays();\n" +
"        } else {\n" +
"          if (typeof map.addListener === 'function') {\n" +
"            map.addListener('load', safeAddOverlays);\n" +
"          } else if (typeof map.on === 'function') {\n" +
"            map.on('load', safeAddOverlays);\n" +
"          }\n" +
"          setTimeout(() => {\n" +
"            safeAddOverlays();\n" +
"          }, 1500);\n" +
"        }";
if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(file, content);
    console.log('Fixed');
} else {
    console.log('Not found');
}
