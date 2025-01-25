#define PI 3.1415926538

varying vec2 vUv;

uniform sampler2D tDiffuse;
uniform float contrast;
uniform float brightness;

void main(){
    vec4 color = texture2D(tDiffuse, vUv);
    if(brightness < 0.0){
        color.rgb = color.rgb * (1.0 + brightness);
    }else{
        color.rgb = color.rgb + ((1.0 - color.rgb) * brightness);
    }
    color.rgb = (color.rgb - 0.5) * (tan((contrast + 1.0) * PI * 0.25)) + 0.5;
    gl_FragColor = color;
}