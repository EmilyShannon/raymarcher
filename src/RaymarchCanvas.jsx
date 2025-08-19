import {useRef, useEffect} from "react";
import vertexShaderSrc from './shader/vertex.glsl?raw';
import fragmentShaderSrc from './shader/fragment.glsl?raw';

export default function RaymarchCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const currentCanvas = canvasRef.current;
        if (!currentCanvas) return;

        // Match WebGL drawing buffer to CSS size
        const dpr = window.devicePixelRatio || 1;
        currentCanvas.width = currentCanvas.clientWidth * dpr;
        currentCanvas.height = currentCanvas.clientHeight * dpr;

        const gl = currentCanvas.getContext("webgl");
        if (!gl) {
            console.error("WebGL not supported in this browser.");
            return;
        }
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

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

        // gl.enable(gl.DEPTH_TEST);

        // Fullscreen quad 
        const positions = [
        -1, -1,
        1, -1,
        -1,  1,
        -1,  1,
        1, -1,
        1,  1,
        ];
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        const aPositionLoc = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(aPositionLoc);
        gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);


        // Finally, render the scene
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6); // draws 2 triangles
       
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
