$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$content = Get-Content -Path $path -Raw

# We look for the BreakableVase class closing brace.
# It ends with: "break() { this.breakVase(); } }" (based on my previous script)
# Or just look for the class block.

if ($content -match "alias just in case") {
    # We found my previous comment "Alias just in case"
    $marker = "break() {
        this.breakVase();
    }"
    
    # We want to append methods after this, before the class closing }.
    # So we replace the marker with marker + new methods.
    
    $newMethods = "break() {
        this.breakVase();
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }"
    
    # Careful with whitespace in regex/replace.
    # Let's find the exact string via IndexOf to be safe.
    $idx = $content.IndexOf("this.breakVase();")
    if ($idx -ne -1) {
        # Find the closing brace of the method
        $methodEndIdx = $content.IndexOf("}", $idx)
        if ($methodEndIdx -ne -1) {
             # Verify it's the `break` method
             # The text "break() {" should be before it.
             
             # Actually, simpler:
             # Search for the LAST closing brace of the class? No, hard to know which one.
             # Search for "break() {"
             
             $breakMethodIdx = $content.IndexOf("break() {")
             if ($breakMethodIdx -ne -1) {
                 # Replace the whole break() method with break() + others
                 # We need to know where it ends.
                 # It ends at `}` followed by `}` (class end).
                 
                 # Let's simple append.
                 # "break() {" ... "}"
                 
                 # Let's replace "break() {" with definitions for position/rotation THEN break().
                 # Or just append.
                 
                 $target = "break() {"
                 $replacement = "setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }

    break() {"
                 
                 $content = $content.Remove($breakMethodIdx, $target.Length).Insert($breakMethodIdx, $replacement)
                 Set-Content -Path $path -Value $content
                 Write-Host "Added setPosition/setRotation methods"
             }
        }
    }
} else {
    Write-Host "Could not find target marker"
}
