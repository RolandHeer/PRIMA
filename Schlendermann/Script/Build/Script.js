"use strict";
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    ƒ.Project.registerScriptNamespace(Script); // Register the namespace to FUDGE for serialization
    class CustomComponentScript extends ƒ.ComponentScript {
        // Register the script as component for use in the editor via drag&drop
        static iSubclass = ƒ.Component.registerSubclass(CustomComponentScript);
        // Properties may be mutated by users in the editor via the automatically created user interface
        message = "CustomComponentScript added to ";
        constructor() {
            super();
            // Don't start when running in editor
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            // Listen to this component being added to or removed from a node
            this.addEventListener("componentAdd" /* COMPONENT_ADD */, this.hndEvent);
            this.addEventListener("componentRemove" /* COMPONENT_REMOVE */, this.hndEvent);
            this.addEventListener("nodeDeserialized" /* NODE_DESERIALIZED */, this.hndEvent);
        }
        // Activate the functions of this component as response to events
        hndEvent = (_event) => {
            switch (_event.type) {
                case "componentAdd" /* COMPONENT_ADD */:
                    ƒ.Debug.log(this.message, this.node);
                    break;
                case "componentRemove" /* COMPONENT_REMOVE */:
                    this.removeEventListener("componentAdd" /* COMPONENT_ADD */, this.hndEvent);
                    this.removeEventListener("componentRemove" /* COMPONENT_REMOVE */, this.hndEvent);
                    break;
                case "nodeDeserialized" /* NODE_DESERIALIZED */:
                    // if deserialized the node is now fully reconstructed and access to all its components and children is possible
                    break;
            }
        };
    }
    Script.CustomComponentScript = CustomComponentScript;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    ƒ.Debug.info("Main Program Template running!");
    let graph;
    let viewport;
    let avatar;
    let camera;
    let cmpCamera;
    let speedRotX = 0.1;
    let speedRotY = -0.1;
    let walkSpeed = 6;
    let ctrlWalk = new ƒ.Control("cntrlWalk", walkSpeed, 0 /* PROPORTIONAL */);
    ctrlWalk.setDelay(200);
    let strafeSpeed = 2;
    let ctrlStrafe = new ƒ.Control("cntrlStrafe", strafeSpeed, 0 /* PROPORTIONAL */);
    ctrlStrafe.setDelay(200);
    let rotX = 0;
    let rotY = 0;
    window.addEventListener("load", init);
    document.addEventListener("interactiveViewportStarted", start);
    let dialog;
    function init(_event) {
        dialog = document.querySelector("dialog");
        dialog.querySelector("h1").textContent = document.title;
        dialog.addEventListener("click", function (_event) {
            // @ts-ignore until HTMLDialog is implemented by all browsers and available in dom.d.ts
            dialog.close();
            startInteractiveViewport();
        });
        //@ts-ignore
        dialog.showModal();
    }
    async function startInteractiveViewport() {
        // load resources referenced in the link-tag
        await FudgeCore.Project.loadResourcesFromHTML();
        FudgeCore.Debug.log("Project:", FudgeCore.Project.resources);
        // pick the graph to show
        let graph = FudgeCore.Project.resources["Graph|2022-04-14T12:56:54.125Z|64295"];
        FudgeCore.Debug.log("Graph:", graph);
        if (!graph) {
            alert("Nothing to render. Create a graph with at least a mesh, material and probably some light");
            return;
        }
        // setup the viewport
        let cmpCamera = new FudgeCore.ComponentCamera();
        let canvas = document.querySelector("canvas");
        let viewport = new FudgeCore.Viewport();
        viewport.initialize("InteractiveViewport", graph, cmpCamera, canvas);
        canvas.addEventListener("mousedown", canvas.requestPointerLock);
        canvas.addEventListener("mouseup", function () { document.exitPointerLock(); });
        viewport.draw();
        canvas.dispatchEvent(new CustomEvent("interactiveViewportStarted", { bubbles: true, detail: viewport }));
    }
    function start(_event) {
        setupAvatar(_event);
        setupAudio();
        ƒ.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, update);
        ƒ.Loop.start(); // start the game loop to continously draw the viewport, update the audiosystem and drive the physics i/a
    }
    function update(_event) {
        // ƒ.Physics.simulate();  // if physics is included and used
        walkController();
        viewport.draw();
        ƒ.AudioManager.default.update();
    }
    function walkController() {
        let inputWalk = ƒ.Keyboard.mapToTrit([ƒ.KEYBOARD_CODE.W, ƒ.KEYBOARD_CODE.ARROW_UP], [ƒ.KEYBOARD_CODE.S, ƒ.KEYBOARD_CODE.ARROW_DOWN]);
        ctrlWalk.setInput(inputWalk);
        let inputStrafe = ƒ.Keyboard.mapToTrit([ƒ.KEYBOARD_CODE.A, ƒ.KEYBOARD_CODE.ARROW_LEFT], [ƒ.KEYBOARD_CODE.D, ƒ.KEYBOARD_CODE.ARROW_RIGHT]);
        ctrlStrafe.setInput(inputStrafe);
        let speedMultiplier = 1;
        if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.SHIFT_LEFT])) {
            speedMultiplier = 1.7;
        }
        if (inputWalk > 0) {
            ctrlStrafe.setFactor(strafeSpeed * 0.75 * speedMultiplier);
        }
        else if (inputWalk < 0) {
            ctrlStrafe.setFactor(strafeSpeed * 0.3 * speedMultiplier);
        }
        else {
            ctrlStrafe.setFactor(strafeSpeed * speedMultiplier);
        }
        if (inputStrafe != 0) {
            ctrlWalk.setFactor(walkSpeed * 0.75 * speedMultiplier);
        }
        else {
            ctrlWalk.setFactor(walkSpeed * speedMultiplier);
        }
        if (inputWalk < 0) {
            ctrlWalk.setFactor(walkSpeed * 0.4 * speedMultiplier);
        }
        avatar.mtxLocal.translateZ(ctrlWalk.getOutput() * ƒ.Loop.timeFrameGame / 1000);
        avatar.mtxLocal.translateX(ctrlStrafe.getOutput() * ƒ.Loop.timeFrameGame / 1000);
    }
    function setupAvatar(_event) {
        viewport = _event.detail;
        graph = viewport.getBranch();
        avatar = viewport.getBranch().getChildrenByName("Avatar")[0];
        camera = avatar.getChild(0);
        viewport.camera = cmpCamera = camera.getComponent(ƒ.ComponentCamera);
        viewport.getCanvas().addEventListener("pointermove", hndPointerMove);
    }
    function hndPointerMove(_event) {
        rotY += _event.movementX * speedRotY;
        avatar.mtxLocal.rotation = ƒ.Vector3.Y(rotY);
        rotX += _event.movementY * speedRotX;
        rotX = Math.min(60, Math.max(-60, rotX));
        cmpCamera.mtxPivot.rotation = ƒ.Vector3.X(rotX);
    }
    function setupAudio() {
        //let audioNode: ƒ.Node = graph.getChildrenByName("Sound")[0];
        ƒ.AudioManager.default.listenTo(graph);
    }
})(Script || (Script = {}));
//# sourceMappingURL=Script.js.map