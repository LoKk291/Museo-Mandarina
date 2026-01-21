$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\Furniture.js"
$content = Get-Content -Path $path -Raw

# Find OldCamera build method and add projector light
$marker = "this.mesh.castShadow = true;
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }
}"

$replacement = "// Projector Light (initially off)
        this.projectorLight = new THREE.SpotLight(0xFFFFAA, 0, 15, Math.PI / 6, 0.5);
        this.projectorLight.position.set(0, 1.5, 0);
        this.projectorLight.target.position.set(0, 1.5, -10);
        this.mesh.add(this.projectorLight);
        this.mesh.add(this.projectorLight.target);
        
        // Light indicator on camera (small glowing sphere)
        this.lightIndicator = new THREE.Mesh(
            new THREE.SphereGeometry(0.05),
            new THREE.MeshStandardMaterial({ 
                color: 0xFF0000,
                emissive: 0x000000
            })
        );
        this.lightIndicator.position.set(0.15, 1.6, 0.3);
        this.mesh.add(this.lightIndicator);

        this.mesh.castShadow = true;
    }

    turnOnLight() {
        if (this.projectorLight) {
            this.projectorLight.intensity = 2;
        }
        if (this.lightIndicator) {
            this.lightIndicator.material.emissive.setHex(0xFF0000);
        }
    }

    turnOffLight() {
        if (this.projectorLight) {
            this.projectorLight.intensity = 0;
        }
        if (this.lightIndicator) {
            this.lightIndicator.material.emissive.setHex(0x000000);
        }
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(y) {
        this.mesh.rotation.y = y;
    }
}"

if ($content -match [regex]::Escape($marker)) {
    $content = $content.Replace($marker, $replacement)
    Set-Content -Path $path -Value $content
    Write-Host "Added projector light to OldCamera"
} else {
    Write-Host "Marker not found in OldCamera"
}
