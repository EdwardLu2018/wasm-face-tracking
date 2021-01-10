attribute vec2 position;
varying vec2 tex_coords;
uniform float flipY;
uniform float flipX;

void main(void) {
    tex_coords = (position + 1.0) / 2.0;
    tex_coords.y = 1.0 - tex_coords.y;
    gl_Position = vec4(position * vec2(flipX, flipY), 0.0, 1.0);
}
