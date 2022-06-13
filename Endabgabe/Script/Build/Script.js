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
        rigid;
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
                case "loopFrame" /* LOOP_FRAME */:
                    let v = this.rigid.getPosition();
                    this.rigid.applyForce(ƒ.Vector3.SCALE(v, -0.4));
                    break;
                case "nodeDeserialized" /* NODE_DESERIALIZED */:
                    this.rigid = this.node.getComponent(ƒ.ComponentRigidbody);
                    ƒ.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, this.hndEvent);
                    // if deserialized the node is now fully reconstructed and access to all its components and children is possible
                    break;
            }
        };
    }
    Script.CustomComponentScript = CustomComponentScript;
})(Script || (Script = {}));
var Endabgabe;
(function (Endabgabe) {
    var ƒ = FudgeCore;
    ƒ.Debug.info("Main Program Template running!");
    /// GAME HIRARCHIE \\\
    let canvas;
    let crc2;
    let graph;
    let viewport;
    let camNode;
    let cameraNode;
    let cameraTranslatorNode;
    let cmpCamera;
    let carNode;
    ///   GAME MODES   \\\
    let isMenue = true;
    ///     VALUES     \\\
    let config;
    ///     OBJECTS    \\\
    let car;
    let cam;
    let world;
    /// RUNTIME VALUES \\\
    let coins = 0;
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
        graph = FudgeCore.Project.resources["Graph|2022-05-18T20:10:05.727Z|72077"];
        FudgeCore.Debug.log("Graph:", graph);
        if (!graph) {
            alert("Nothing to render. Create a graph with at least a mesh, material and probably some light");
            return;
        }
        // setup the viewport
        let cmpCamera = new FudgeCore.ComponentCamera();
        canvas = document.querySelector("canvas");
        viewport = new FudgeCore.Viewport();
        viewport.initialize("InteractiveViewport", graph, cmpCamera, canvas);
        canvas.addEventListener("mousedown", enterPointerLock);
        window.addEventListener("keydown", hndKeydown);
        viewport.draw();
        canvas.dispatchEvent(new CustomEvent("interactiveViewportStarted", { bubbles: true, detail: viewport }));
    }
    async function start(_event) {
        let response = await fetch("config.json");
        config = await response.json();
        initValues();
        setupCar();
        setupCam();
        setupAudio();
        world = new Endabgabe.World(config, graph.getChildrenByName("World")[0]);
        ƒ.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, update);
        ƒ.Loop.start(); // start the game loop to continously draw the viewport, update the audiosystem and drive the physics i/a
    }
    function update(_event) {
        car.update();
        cam.update(car.getCamPos());
        ƒ.Physics.simulate(); // if physics is included and used
        renderScreen();
    }
    function renderScreen() {
        viewport.draw();
        renderVUI();
    }
    function renderVUI() {
        // Coins
        crc2.fillStyle = "#fff";
        crc2.font = config.fontHeight + "px Arial";
        crc2.fillText("Coins: " + coins, config.margin, config.margin * 2);
        // Gaz
        crc2.fillText("Gaz: " + Math.round(car.getGazPercent()) + "%", config.margin, config.margin * 4);
        // Speedometer
        crc2.save();
        crc2.resetTransform();
        crc2.translate(canvas.width - 200, canvas.height - 30);
        crc2.rotate((Math.abs(car.getSpeedPercent()) * 180) * Math.PI / 180);
        crc2.fillRect(-100, -5, 105, 10);
        crc2.restore();
    }
    function enterPointerLock() {
        canvas.requestPointerLock();
        isMenue = false;
    }
    function hndKeydown(_key) {
        switch (_key.code) {
            case "KeyM":
                isMenue = true;
                document.exitPointerLock();
                break;
        }
    }
    function initValues() {
        graph = viewport.getBranch();
        crc2 = canvas.getContext("2d");
    }
    function setupCar() {
        carNode = graph.getChildren()[0];
        car = new Endabgabe.Car(config, carNode);
    }
    function setupCam() {
        camNode = graph.getChildrenByName("Cam")[0];
        cameraNode = camNode.getChildren()[0].getChildrenByName("Camera")[0];
        cameraTranslatorNode = cameraNode.getChildren()[0];
        viewport.camera = cmpCamera = cameraTranslatorNode.getComponent(ƒ.ComponentCamera);
        cam = new Endabgabe.Cam(camNode);
    }
    function setupAudio() {
        //let audioNode: ƒ.Node = graph.getChildrenByName("Sound")[0];
        ƒ.AudioManager.default.listenTo(graph);
    }
})(Endabgabe || (Endabgabe = {}));
var Endabgabe;
(function (Endabgabe) {
    var ƒ = FudgeCore;
    class World {
        config;
        coins;
        coinGraph;
        cans;
        canGraph;
        constructor(_config, _world) {
            this.config = _config;
            this.coins = _world.getChildrenByName("Collectables")[0].getChildrenByName("Coins")[0];
            this.cans = _world.getChildrenByName("Collectables")[0].getChildrenByName("Cans")[0];
            //this.canGraph = 
            this.generateCoins();
            this.generateCans();
        }
        generateCoins() {
            for (let j = 0; j < this.config.maxCoinCluster; j++) {
                let tempCluster = new ƒ.Node("Cluster" + j);
                let pos = new ƒ.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
                for (let i = 0; i < 10; i++) {
                    let tempPos = ƒ.Vector3.NORMALIZATION(new ƒ.Vector3(pos.x + Math.random() * 0.1, pos.y + Math.random() * 0.1, pos.z + Math.random() * 0.1), 50.5);
                    let tempCoinNode = new ƒ.Node("Coin" + i);
                    let cmpTransform = new ƒ.ComponentTransform(new ƒ.Matrix4x4());
                    tempCoinNode.addComponent(cmpTransform);
                    this.addGraphToNode(tempCoinNode, "Graph|2022-06-11T00:20:48.515Z|71676");
                    tempCoinNode.mtxLocal.translation = tempPos;
                    tempCoinNode.mtxLocal.lookAt(new ƒ.Vector3(0, 0, 0));
                    tempCoinNode.mtxLocal.rotateX(-90);
                    tempCluster.addChild(tempCoinNode);
                }
                this.coins.addChild(tempCluster);
            }
        }
        generateCans() {
            for (let i = 0; i < this.config.maxCans; i++) {
                let tempPos = ƒ.Vector3.NORMALIZATION(new ƒ.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1), 50.2);
                let tempCanNode = new ƒ.Node("Can" + i);
                let cmpTransform = new ƒ.ComponentTransform(new ƒ.Matrix4x4());
                tempCanNode.addComponent(cmpTransform);
                this.addGraphToNode(tempCanNode, "Graph|2022-06-10T22:51:14.617Z|07901");
                tempCanNode.mtxLocal.translation = tempPos;
                tempCanNode.mtxLocal.lookAt(new ƒ.Vector3(0, 0, 0));
                tempCanNode.mtxLocal.rotateX(-90);
                this.cans.addChild(tempCanNode);
            }
        }
        async addGraphToNode(_node, _id) {
            const graph = await ƒ.Project.createGraphInstance(ƒ.Project.resources[_id]);
            _node.addChild(graph);
        }
    }
    Endabgabe.World = World;
})(Endabgabe || (Endabgabe = {}));
var Endabgabe;
(function (Endabgabe) {
    class Cam {
        camNode;
        constructor(_camNode) {
            this.camNode = _camNode;
        }
        update(_newPos) {
            this.camNode.mtxLocal.rotation = _newPos;
        }
    }
    Endabgabe.Cam = Cam;
})(Endabgabe || (Endabgabe = {}));
var Endabgabe;
(function (Endabgabe) {
    var ƒ = FudgeCore;
    class Car {
        config;
        car;
        main;
        body;
        rigidBody;
        mtxTireL;
        mtxTireR;
        ctrlDrive;
        ctrlTurn;
        currentSpeed;
        // Runtime Values 
        gaz = 100;
        posArray = [];
        //private oldDrive: number = 0;
        constructor(_config, _car) {
            this.config = _config;
            this.car = _car;
            this.main = _car.getChildren()[0];
            this.body = this.main.getChildrenByName("Body")[0];
            this.rigidBody = this.main.getComponent(ƒ.ComponentRigidbody);
            this.mtxTireL = this.main.getChildrenByName("TireFL")[0].getComponent(ƒ.ComponentTransform).mtxLocal;
            this.mtxTireR = this.main.getChildrenByName("TireFR")[0].getComponent(ƒ.ComponentTransform).mtxLocal;
            this.setupControls(_config);
        }
        update() {
            this.updateTurning(this.updateDriving());
            this.updatePosArray();
        }
        getCamPos() {
            return this.posArray[0];
        }
        getSpeedPercent() {
            return this.currentSpeed / this.config.maxSpeed;
        }
        getGazPercent() {
            return this.gaz;
        }
        updateDriving() {
            let inputDrive = ƒ.Keyboard.mapToTrit([ƒ.KEYBOARD_CODE.W, ƒ.KEYBOARD_CODE.ARROW_UP], [ƒ.KEYBOARD_CODE.S, ƒ.KEYBOARD_CODE.ARROW_DOWN]);
            if (inputDrive != 0 && this.gaz == 0) {
                inputDrive = 0;
            }
            this.ctrlDrive.setInput(inputDrive);
            this.car.mtxLocal.rotateX(this.ctrlDrive.getOutput()); //ehemals Loop Frame Time
            this.currentSpeed = this.ctrlDrive.getOutput();
            this.updateGaz(this.ctrlDrive.getOutput()); //ehemals Loop Frame Time
            return this.ctrlDrive.getOutput(); //ehemals Loop Frame Time
        }
        updateTurning(_drive) {
            let inputTurn = ƒ.Keyboard.mapToTrit([ƒ.KEYBOARD_CODE.A, ƒ.KEYBOARD_CODE.ARROW_LEFT], [ƒ.KEYBOARD_CODE.D, ƒ.KEYBOARD_CODE.ARROW_RIGHT]);
            this.ctrlTurn.setInput(inputTurn);
            if (_drive > 0) {
                this.car.mtxLocal.rotateY(this.ctrlTurn.getOutput() * Math.min(0.3, _drive)); //ehemals Loop Frame Time
            }
            else {
                this.car.mtxLocal.rotateY(this.ctrlTurn.getOutput() * Math.max(-0.3, _drive)); //ehemals Loop Frame Time
            }
            this.updateYawTilt(_drive, this.ctrlTurn.getOutput());
            this.updateWheels(this.ctrlTurn.getOutput());
        }
        updateYawTilt(_drive, _turn) {
            if (_drive > 0) {
                this.body.mtxLocal.rotation = new ƒ.Vector3(0, 0, (_drive * _turn) * 3);
            }
            else {
                this.body.mtxLocal.rotation = new ƒ.Vector3(0, 0, (-_drive * _turn) * 3);
            }
            //this.oldDrive = _drive;
        }
        updateWheels(_turn) {
            this.mtxTireL.rotation = ƒ.Vector3.Y(_turn * 4);
            this.mtxTireR.rotation = ƒ.Vector3.Y(_turn * 4);
        }
        updateGaz(_factor) {
            this.gaz = Math.max(0, this.gaz - 0.05 * Math.abs(_factor));
        }
        updatePosArray() {
            let tempPos = this.car.mtxLocal.getEulerAngles();
            let newPos = new ƒ.Vector3(tempPos.x, tempPos.y, tempPos.z);
            this.posArray.push(newPos);
            if (this.posArray.length > this.config.camDelay) {
                this.posArray.splice(0, 1);
            }
        }
        setupControls(_config) {
            this.ctrlDrive = new ƒ.Control("cntrlWalk", _config.maxSpeed, 0 /* PROPORTIONAL */);
            this.ctrlDrive.setDelay(_config.accelSpeed);
            this.ctrlTurn = new ƒ.Control("cntrlTurn", _config.maxTurn, 0 /* PROPORTIONAL */);
            this.ctrlTurn.setDelay(_config.accelTurn);
        }
    }
    Endabgabe.Car = Car;
})(Endabgabe || (Endabgabe = {}));
//# sourceMappingURL=Script.js.map