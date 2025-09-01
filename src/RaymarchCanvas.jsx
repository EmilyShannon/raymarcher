import {useRef, useEffect} from "react";
import vertexShaderSrc from './shader/vertex.glsl?raw';
import fragmentShaderSrc from './shader/fragment.glsl?raw';
import {mat4} from 'gl-matrix';
import matcapSrc from '/matcap/matcap_img_1.jpg';

export default function RaymarchCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const currentCanvas = canvasRef.current;
        if (!currentCanvas) return;

        // Match WebGL drawing buffer to CSS size
        const dpr = window.devicePixelRatio || 1;
        currentCanvas.width = currentCanvas.clientWidth * dpr;
        currentCanvas.height = currentCanvas.clientHeight * dpr;

        const gl = currentCanvas.getContext("webgl2", { depth: true });
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

        // Set quad
        const quadVerts = new Float32Array([
          -1, -1,
          1, -1,
          -1, 1,
          -1, 1,
          1, -1,
          1, 1,
        ]);

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // place quads
        const quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

        // set resolution uniform
        const resLoc = gl.getUniformLocation(program, "u_resolution");

        // texture setup
        let texture;
        const matcapImage = new Image();
        matcapImage.src = matcapSrc; 
        matcapImage.onload = () => {
          texture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, texture);

          gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, matcapImage
          );

          // set texture parameters
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

          // create texture uniform
          const matcapLoc = gl.getUniformLocation(program, "u_matcapTexture");
          // sampler uses texture unit 0
          gl.uniform1i(matcapLoc, 0); 
        };

        matcapImage.onerror = (e) => {
          console.error("Texture image failed to load", e);
        };

        // set the resolution so that image can be scaled to aspect ratio
        const width = gl.drawingBufferWidth;
        const height = gl.drawingBufferHeight;
        const aspectX = width / height; 
        const aspectY = height / width; 
        gl.uniform4f(resLoc, width, height, aspectX, aspectY);

        // set the location of the vertex positions 
        const aPosLoc = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(aPosLoc);
        gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

        // set locations of camera and MVP matrices and set their values
        const modelLoc = gl.getUniformLocation(program, "u_model");
        const viewLoc = gl.getUniformLocation(program, "u_view");
        const projectionLoc = gl.getUniformLocation(program, "u_projection");

        const model = mat4.create();
        const view = mat4.create();
        const projection = mat4.create();

        const cameraPosition = [3, 0, -2];
        const camPosLoc = gl.getUniformLocation(program, "u_cameraPosition");
        gl.uniform3fv(camPosLoc, cameraPosition);

        mat4.lookAt(view, cameraPosition, [0, 0, 0], [0, 1, 0]);
        mat4.perspective(projection, Math.PI / 1.5, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000);

        // set MVP inverses
        gl.uniformMatrix4fv(modelLoc, false, model);
        gl.uniformMatrix4fv(viewLoc, false, view);
        gl.uniformMatrix4fv(projectionLoc, false, projection);

        const uInvModelLoc = gl.getUniformLocation(program, "u_invModel");
        const uInvViewLoc = gl.getUniformLocation(program, "u_invView");
        const uInvProjLoc = gl.getUniformLocation(program, "u_invProjection");

        const invModel = mat4.create();
        mat4.invert(invModel, model);

        const invView = mat4.create();
        mat4.invert(invView, view);

        const invProj = mat4.create();
        mat4.invert(invProj, projection);

        gl.uniformMatrix4fv(uInvModelLoc, false, invModel);
        gl.uniformMatrix4fv(uInvViewLoc, false, invView);
        gl.uniformMatrix4fv(uInvProjLoc, false, invProj);

        // Finally, render the scene
        const draw = () => {
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          // bind texture
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        draw();

        // animation loop - rotate and redraw
        let animationFrameId;
        let angle = 0;
        let renderLoop = () => {
          angle += 0.025;
          mat4.identity(model);
          mat4.rotate(model, model, angle, [1, 0, 0]);
          gl.uniformMatrix4fv(modelLoc, false, model);
          // also update the inverse for SDF
          const invModel = mat4.create();
          mat4.invert(invModel, model);
          gl.uniformMatrix4fv(uInvModelLoc, false, invModel);
          draw();
          animationFrameId = requestAnimationFrame(renderLoop);
        }

        renderLoop();
        
        // Cleanup 
        return () => {
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }
          gl.deleteBuffer(quadBuffer);
          gl.deleteProgram(program);
          gl.deleteShader(vertexShader);
          gl.deleteShader(fragmentShader);
        };
    }, []);

    return (
        <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: "block" }}/>
    );
};
