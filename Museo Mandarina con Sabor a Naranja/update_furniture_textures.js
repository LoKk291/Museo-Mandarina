const fs = require('fs');
const path = 'src/Furniture.js';

try {
    let content = fs.readFileSync(path, 'utf8');

    function updateClass(className, newTexture) {
        const classIdx = content.indexOf(`class ${className}`);
        if (classIdx === -1) {
            console.log(`Class ${className} not found`);
            return;
        }

        // Find the next class to limit scope
        let nextClassIdx = content.indexOf('class ', classIdx + 10);
        if (nextClassIdx === -1) nextClassIdx = content.length;

        let classBlock = content.substring(classIdx, nextClassIdx);

        // 1. Replace Texture Path
        // Look for loader.load('...')
        // We use a regex specific to this block
        const loadRegex = /loader\.load\s*\(\s*['"].*?['"]\s*\)/;
        if (!loadRegex.test(classBlock)) {
            console.log(`Loader not found in ${className}`);
            // Try to find if it was using a variable?
            // If not found, we might need to insert it?
            // But we saw it in previous reads (implied).
        } else {
            classBlock = classBlock.replace(loadRegex, `loader.load('textures/minecraft/${newTexture}')`);
            console.log(`Updated texture path for ${className}`);
        }

        // 2. Replace faceUVs logic
        // We want to replace the whole `const faceUVs = { ... };` block with 1:1 mapping.
        const uvRegex = /const faceUVs\s*=\s*\{[\s\S]*?\};/;

        const simpleUVs = `const faceUVs = {
            right: { x: 0, y: 0, w: 1, h: 1 },
            left: { x: 0, y: 0, w: 1, h: 1 },
            top: { x: 0, y: 0, w: 1, h: 1 },
            bottom: { x: 0, y: 0, w: 1, h: 1 },
            front: { x: 0, y: 0, w: 1, h: 1 },
            back: { x: 0, y: 0, w: 1, h: 1 }
        };`;

        if (uvRegex.test(classBlock)) {
            classBlock = classBlock.replace(uvRegex, simpleUVs);
            console.log(`Updated UVs for ${className}`);
        } else {
            console.log(`UV block not found in ${className}`);
        }

        // Put it back
        content = content.substring(0, classIdx) + classBlock + content.substring(nextClassIdx);
    }

    updateClass('CraftingTable', 'crafting_table.png');
    updateClass('Furnace', 'furnace.png');

    fs.writeFileSync(path, content, 'utf8');
    console.log('Done updating Furniture.js');

} catch (e) {
    console.error('Error:', e);
}
