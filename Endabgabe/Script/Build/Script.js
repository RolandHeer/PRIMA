"use strict";
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    ƒ.Project.registerScriptNamespace(Script); // Register the namespace to FUDGE for serialization
    class GravityScript extends ƒ.ComponentScript {
        // Register the script as component for use in the editor via drag&drop
        static iSubclass = ƒ.Component.registerSubclass(GravityScript);
        // Properties may be mutated by users in the editor via the automatically created user interface
        message = "GravityScript added to ";
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
                    //ƒ.Debug.log(this.message, this.node);
                    break;
                case "componentRemove" /* COMPONENT_REMOVE */:
                    this.removeEventListener("componentAdd" /* COMPONENT_ADD */, this.hndEvent);
                    this.removeEventListener("componentRemove" /* COMPONENT_REMOVE */, this.hndEvent);
                    break;
                case "renderPrepare" /* RENDER_PREPARE */:
                    let v = this.rigid.getPosition();
                    this.rigid.applyForce(ƒ.Vector3.SCALE(v, -0.3));
                    break;
                case "nodeDeserialized" /* NODE_DESERIALIZED */:
                    this.rigid = this.node.getComponent(ƒ.ComponentRigidbody);
                    this.node.addEventListener("renderPrepare" /* RENDER_PREPARE */, this.hndEvent);
                    // if deserialized the node is now fully reconstructed and access to all its components and children is possible
                    break;
            }
        };
    }
    Script.GravityScript = GravityScript;
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
        world = new Endabgabe.World(config, graph.getChildrenByName("World")[0]);
        setupCar();
        setupCam();
        setupAudio();
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
        crc2.fillText("Coins: " + car.getScore(), config.margin, config.margin * 2);
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
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    ƒ.Project.registerScriptNamespace(Script); // Register the namespace to FUDGE for serialization
    class RotationScript extends ƒ.ComponentScript {
        // Register the script as component for use in the editor via drag&drop
        static iSubclass = ƒ.Component.registerSubclass(RotationScript);
        // Properties may be mutated by users in the editor via the automatically created user interface
        message = "RotationScript added to ";
        mtx;
        rotationSpeed = 4;
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
                    //ƒ.Debug.log(this.message, this.node);
                    break;
                case "componentRemove" /* COMPONENT_REMOVE */:
                    this.removeEventListener("componentAdd" /* COMPONENT_ADD */, this.hndEvent);
                    this.removeEventListener("componentRemove" /* COMPONENT_REMOVE */, this.hndEvent);
                    break;
                case "renderPrepare" /* RENDER_PREPARE */:
                    this.mtx.rotate(ƒ.Vector3.Y(this.rotationSpeed));
                    break;
                case "nodeDeserialized" /* NODE_DESERIALIZED */:
                    this.mtx = this.node.getComponent(ƒ.ComponentMesh).mtxPivot;
                    this.mtx.rotate(ƒ.Vector3.Y(Math.random() * 360));
                    this.node.addEventListener("renderPrepare" /* RENDER_PREPARE */, this.hndEvent);
                    // if deserialized the node is now fully reconstructed and access to all its components and children is possible
                    break;
            }
        };
    }
    Script.RotationScript = RotationScript;
})(Script || (Script = {}));
var Endabgabe;
(function (Endabgabe) {
    var ƒ = FudgeCore;
    class World {
        config;
        coins;
        static coinGraphID;
        cans;
        static canGraphID;
        constructor(_config, _world) {
            this.config = _config;
            this.coins = _world.getChildrenByName("Collectables")[0].getChildrenByName("Coins")[0];
            World.coinGraphID = "Graph|2022-06-11T00:20:48.515Z|71676";
            this.cans = _world.getChildrenByName("Collectables")[0].getChildrenByName("Cans")[0];
            World.canGraphID = "Graph|2022-06-10T22:51:14.617Z|07901";
            this.generateCoins(this.config.maxCoinCluster, 10);
            this.generateCans(this.config.maxCans);
        }
        generateCoins(_clusterCount, _clusterSize) {
            for (let j = 0; j < _clusterCount; j++) {
                let tempCluster = new ƒ.Node("Cluster" + j);
                let pos = new ƒ.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
                for (let i = 0; i < _clusterSize; i++) {
                    let tempPos = ƒ.Vector3.NORMALIZATION(new ƒ.Vector3(pos.x + Math.random() * 0.1, pos.y + Math.random() * 0.1, pos.z + Math.random() * 0.1), 50.5);
                    let tempCoinNode = new ƒ.Node("Coin" + i);
                    let cmpTransform = new ƒ.ComponentTransform(new ƒ.Matrix4x4());
                    tempCoinNode.addComponent(cmpTransform);
                    this.addGraphToNode(tempCoinNode, World.coinGraphID);
                    tempCoinNode.mtxLocal.translation = tempPos;
                    tempCoinNode.mtxLocal.lookAt(new ƒ.Vector3(0, 0, 0));
                    tempCoinNode.mtxLocal.rotateX(-90);
                    tempCluster.addChild(tempCoinNode);
                }
                this.coins.addChild(tempCluster);
            }
        }
        generateCans(_canCount) {
            for (let i = 0; i < _canCount; i++) {
                let tempPos = ƒ.Vector3.NORMALIZATION(new ƒ.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1), 50.2);
                let tempCanNode = new ƒ.Node("Can" + i);
                let cmpTransform = new ƒ.ComponentTransform(new ƒ.Matrix4x4());
                tempCanNode.addComponent(cmpTransform);
                this.addGraphToNode(tempCanNode, World.canGraphID);
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
        score = 0;
        posArray = [];
        //private oldDrive: number = 0;
        constructor(_config, _car) {
            this.config = _config;
            this.car = _car;
            this.main = _car.getChildren()[0];
            this.body = this.main.getChildrenByName("Body")[0];
            this.rigidBody = this.main.getComponent(ƒ.ComponentRigidbody);
            this.rigidBody.addEventListener("TriggerEnteredCollision" /* TRIGGER_ENTER */, this.hndCollision);
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
        getScore() {
            return this.score;
        }
        hndCollision = (_event) => {
            let graph = _event.cmpRigidbody.node;
            if (graph.idSource == Endabgabe.World.coinGraphID) {
                this.score++;
                graph.getParent().getParent().removeChild(graph.getParent());
            }
            if (graph.idSource == Endabgabe.World.canGraphID) {
                this.gaz = 100;
                graph.getParent().getParent().removeChild(graph.getParent());
            }
        };
        updateDriving() {
            let inputDrive = ƒ.Keyboard.mapToTrit([ƒ.KEYBOARD_CODE.W, ƒ.KEYBOARD_CODE.ARROW_UP], [ƒ.KEYBOARD_CODE.S, ƒ.KEYBOARD_CODE.ARROW_DOWN]);
            if (this.ctrlDrive.getOutput() >= 0) { //Driving Forward
                this.ctrlDrive.setFactor(this.config.maxSpeed);
                if (this.gaz == 0 && inputDrive > 0) { //Disable Speedup without gaz while still beeing able to break
                    inputDrive = 0;
                }
            }
            else { //Driving Backward
                this.ctrlDrive.setFactor(this.config.maxSpeed / 3);
                if (this.gaz == 0 && inputDrive < 0) { //Disable Speedup without gaz while still beeing able to break
                    inputDrive = 0;
                }
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
            this.ctrlDrive = new ƒ.Control("cntrlDrive", _config.maxSpeed, 0 /* PROPORTIONAL */);
            this.ctrlDrive.setDelay(_config.accelSpeed);
            this.ctrlTurn = new ƒ.Control("cntrlTurn", _config.maxTurn, 0 /* PROPORTIONAL */);
            this.ctrlTurn.setDelay(_config.accelTurn);
        }
    }
    Endabgabe.Car = Car;
})(Endabgabe || (Endabgabe = {}));
//# sourceMappingURL=Script.js.map