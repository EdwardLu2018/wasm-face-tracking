precision highp float;

uniform sampler2D u_image;
varying vec2 tex_coords;

const vec4 g = vec4(0.299, 0.587, 0.114, 0.0);

void main(void) {
    vec4 color = texture2D(u_image, tex_coords);
    float gray = dot(color.rgba, g);
    gl_FragColor = vec4(gray, gray, gray, 1.0);
}
