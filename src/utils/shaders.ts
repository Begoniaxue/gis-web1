export const customShaders = {
  plotGradient: `
    czm_material czm_getMaterial(czm_materialInput materialInput)
    {
      czm_material material = czm_getDefaultMaterial(materialInput);
      vec2 st = materialInput.st;
      
      float dist = distance(st, vec2(0.5));
      float alpha = smoothstep(0.0, 0.5, dist);
      
      vec3 color1 = vec3(0.2, 0.6, 1.0);
      vec3 color2 = vec3(0.0, 0.3, 0.6);
      vec3 finalColor = mix(color1, color2, alpha);
      
      material.diffuse = finalColor;
      material.alpha = 0.7;
      material.specular = 0.1;
      return material;
    }
  `,

  buildingFacade: `
    czm_material czm_getMaterial(czm_materialInput materialInput)
    {
      czm_material material = czm_getDefaultMaterial(materialInput);
      vec2 st = materialInput.st;
      
      float windowPattern = step(0.1, fract(st.x * 20.0)) * step(0.1, fract(st.y * 10.0));
      vec3 baseColor = vec3(0.8, 0.8, 0.85);
      vec3 windowColor = vec3(0.3, 0.4, 0.6);
      
      vec3 finalColor = mix(windowColor, baseColor, windowPattern);
      
      float nightGlow = 0.5 + 0.5 * sin(czm_frameNumber * 0.01);
      finalColor += windowColor * nightGlow * 0.3;
      
      material.diffuse = finalColor;
      material.alpha = 1.0;
      material.specular = 0.3;
      return material;
    }
  `,

  bloom: `
    uniform sampler2D colorTexture;
    uniform float bloomIntensity;
    uniform float bloomThreshold;
    
    void main() {
      vec2 texCoord = gl_FragCoord.xy / czm_viewport.zw;
      vec4 color = texture2D(colorTexture, texCoord);
      
      float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      vec4 bloomColor = color * step(bloomThreshold, brightness);
      
      gl_FragColor = color + bloomColor * bloomIntensity;
    }
  `,

  fog: `
    uniform sampler2D colorTexture;
    uniform sampler2D depthTexture;
    uniform float fogDensity;
    uniform vec3 fogColor;
    
    void main() {
      vec2 texCoord = gl_FragCoord.xy / czm_viewport.zw;
      vec4 color = texture2D(colorTexture, texCoord);
      float depth = texture2D(depthTexture, texCoord).r;
      
      float fogFactor = 1.0 - exp(-depth * fogDensity);
      fogFactor = clamp(fogFactor, 0.0, 1.0);
      
      vec3 finalColor = mix(color.rgb, fogColor, fogFactor);
      
      gl_FragColor = vec4(finalColor, color.a);
    }
  `
}

export function createPlotShaderMaterial(color: string) {
  return `
    czm_material czm_getMaterial(czm_materialInput materialInput)
    {
      czm_material material = czm_getDefaultMaterial(materialInput);
      vec2 st = materialInput.st;
      
      float edge = smoothstep(0.0, 0.02, st.x) * smoothstep(1.0, 0.98, st.x) *
                   smoothstep(0.0, 0.02, st.y) * smoothstep(1.0, 0.98, st.y);
      
      vec3 baseColor = ${hexToRgb(color)};
      vec3 edgeColor = vec3(1.0, 1.0, 1.0);
      
      material.diffuse = mix(edgeColor, baseColor, edge);
      material.alpha = 0.6 + edge * 0.2;
      material.specular = 0.2;
      return material;
    }
  `
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    const r = parseInt(result[1], 16) / 255
    const g = parseInt(result[2], 16) / 255
    const b = parseInt(result[3], 16) / 255
    return `vec3(${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)})`
  }
  return 'vec3(1.0, 1.0, 1.0)'
}
