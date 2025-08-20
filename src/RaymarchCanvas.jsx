import {useRef, useEffect} from "react";
import vertexShaderSrc from './shader/vertex.glsl?raw';
import fragmentShaderSrc from './shader/fragment.glsl?raw';
import {mat4} from 'gl-matrix';

export default function RaymarchCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const currentCanvas = canvasRef.current;
        if (!currentCanvas) return;

        // Match WebGL drawing buffer to CSS size
        const dpr = window.devicePixelRatio || 1;
        currentCanvas.width = currentCanvas.clientWidth * dpr;
        currentCanvas.height = currentCanvas.clientHeight * dpr;

        const gl = currentCanvas.getContext("webgl", { depth: true });
        if (!gl) {
            console.error("WebGL not supported in this browser.");
            return;
        }
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        function compileShader(gl, shaderType, shaderSource) {
          // Create the shader object
          var shader = gl.createShader(shaderType);
        
          // Set the shader source code.
          gl.shaderSource(shader, shaderSource);
        
          // Compile the shader
          gl.compileShader(shader);
        
          // Check if it compiled
          var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
          if (!success) {
            // Something went wrong during compilation; get the error
            throw "could not compile shader:" + gl.getShaderInfoLog(shader);
          }
        
          return shader;
        }

        function createProgram(gl, vertexShader, fragmentShader) {
          // create a program.
          var program = gl.createProgram();
        
          // attach the shaders.
          gl.attachShader(program, vertexShader);
          gl.attachShader(program, fragmentShader);
        
          // link the program.
          gl.linkProgram(program);
        
          // Check if it linked.
          var success = gl.getProgramParameter(program, gl.LINK_STATUS);
          if (!success) {
              // something went wrong with the link
              throw ("program failed to link:" + gl.getProgramInfoLog (program));
          }
        
          return program;
        };

        // Compile shaders
        const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
        const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);

        const program = createProgram(gl, vertexShader, fragmentShader);
        gl.useProgram(program);

        gl.enable(gl.DEPTH_TEST);

        // Create a cube, with colors
        // 6 faces, 2 triangles per face, 3 vertices per triangle
        const positions = [
          -1, -1, 1,  0, 0, 1,
          1, -1, 1,  0, 0, 1,
          -1,  1, 1,  0, 0, 1,
          -1,  1, 1,  0, 0, 1,
          1, -1, 1,  0, 0, 1,
          1,  1, 1,  0, 0, 1,

          -1, -1, -1,  0, 1, 1,
          1, -1, -1,  0, 1, 1,
          -1,  1, -1,  0, 1, 1,
          -1,  1, -1,  0, 1, 1,
          1, -1, -1,  0, 1, 1,
          1,  1, -1,  0, 1, 1,

          -1, -1, -1,  0, 0, 0,
          1, -1, -1,  0, 0, 0,
          -1,  1, -1,  0, 0, 0,
          -1,  1, -1,  0, 0, 0,
          1, -1, -1,  0, 0, 0,
          1,  1, -1,  0, 0, 0,

          1,  1,  1,  1, 0, 1,
          1, -1,  1,  1, 0, 1,
          1, -1, -1,  1, 0, 1,
          1,  1, -1,  1, 0, 1,
          1,  1,  1,  1, 0, 1,
          1, -1, -1,  1, 0, 1,

          1,  1, -1,  1, 0, 0,
          1, -1, -1,  1, 0, 0,
          1, -1,  1,  1, 0, 0,
          1,  1,  1,  1, 0, 0,
          1,  1, -1,  1, 0, 0,
          1, -1, -1,  1, 0, 0,

          1,  1, -1,  1, 1, 1,
          1, -1, -1,  1, 1, 1,
          1, -1,  1,  1, 1, 1,
          1,  1,  1,  1, 1, 1,
          1,  1, -1,  1, 1, 1,
          1, -1, -1,  1, 1, 1,

        ];

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        const aPositionLoc = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(aPositionLoc);
        gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false, 24, 0);
        const aColorLoc = gl.getAttribLocation(program, "a_color");
        gl.enableVertexAttribArray(aColorLoc);
        gl.vertexAttribPointer(aColorLoc, 3, gl.FLOAT, false, 24, 12);

        const modelLoc = gl.getUniformLocation(program, "u_model");
        const viewLoc = gl.getUniformLocation(program, "u_view");
        const projectionLoc = gl.getUniformLocation(program, "u_projection");

        const model = mat4.create();
        const view = mat4.create();
        const projection = mat4.create();

        mat4.scale(model, model, [0.5, 0.5, 0.5]); // Scale the cube
        mat4.rotateZ(model, model, Math.PI / 4); // Rotate the cube
        mat4.lookAt(view, [5, 5, 5], [0, 0, 0], [0, 1, 0]);
        mat4.perspective(projection, Math.PI / 4, gl.drawingBufferWidth / gl.drawingBufferHeight, 1, 1000);

        gl.uniformMatrix4fv(modelLoc, false, model);
        gl.uniformMatrix4fv(viewLoc, false, view);
        gl.uniformMatrix4fv(projectionLoc, false, projection);

        // Finally, render the scene
        const draw = () => {
          requestAnimationFrame(draw);
          mat4.rotateY(model, model, 0.1, [1, 0, 1]); // Rotate the cube
          gl.uniformMatrix4fv(modelLoc, false, model);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLES, 0, 36);
        }
        draw();
        // Cleanup 
        return () => {
          gl.deleteBuffer(positionBuffer);
          gl.deleteProgram(program);
          gl.deleteShader(vertexShader);
          gl.deleteShader(fragmentShader);
        };
    }, []);

    return (
        <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: "block" }}/>
    );
};
