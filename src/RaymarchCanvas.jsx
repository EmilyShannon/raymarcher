import {useRef, useEffect} from "react";

const vertexShaderSrc = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5; // map from [-1,1] to [0,1]
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSrc = `
  precision highp float;
  varying vec2 v_uv;

  void main() {
    // test: colorful gradient
    gl_FragColor = vec4(v_uv, 0.5 + 0.5 * sin(v_uv.x * 10.0), 1.0);
  }
`;

export default function RaymarchCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const currentCanvas = canvasRef.current;
        if (!currentCanvas) return;

        const gl = currentCanvas.getContext("webgl");
        if (!gl) {
            console.error("WebGL not supported in this browser.");
            return;
        }
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Fullscreen quad 
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = [
        -1, -1,
        1, -1,
        -1,  1,
        -1,  1,
        1, -1,
        1,  1,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        // Create and link program
        const program = gl.createProgram();

        const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSrc);
        const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSrc);

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
        }

        gl.useProgram(program);

        const aPositionLoc = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(aPositionLoc);
        gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

        // Shader creation/compilation
        function createShader(type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(shader));
            }
            return shader;
        }

        // Finally, render the scene
        function render() {
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 6); // draws 2 triangles
        }
        render();
    }, []);

    return (
        <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: "block" }}/>
    );
};
