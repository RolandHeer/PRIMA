namespace Raserei {
  import ƒ = FudgeCore;
  ƒ.Debug.info("Main Program Template running!");

  export interface Config {
    captureTime: number;
    speedDivider: number;
    turnDivider: number;
    maxTurn: number;
    accelTurn: number;
    fuelConsumption: number;
    camDelay: number;
    maxCoinCluster: number;
    maxCans: number;
    speedometerHeight: number;
    [key: string]: number | string | Config;
  }

  /// GAME HIRARCHIE \\\
  let canvas: HTMLCanvasElement;
  let crc2: CanvasRenderingContext2D;
  let graph: ƒ.Node;
  let viewport: ƒ.Viewport;
  let camNode: ƒ.Node;
  let cmpCamera: ƒ.ComponentCamera;
  let carNode: ƒ.Node;
  let policeCarNode: ƒ.Node;

  ///   GAME MODES   \\\
  let lockMode: boolean = true;
  let state: number = 1;          //0=menue; 1=game running; 2=police got you; 3=no fuel

  ///     VALUES     \\\
  let config: Config;

  ///     OBJECTS    \\\
  let car: PlayerCar;
  let policeCar: PoliceCar;
  let cam: Cam;
  let world: World;
  let gamestate: GameState;

  //       DATA      \\\
  let speedImg: HTMLImageElement = new Image;
  speedImg.src = "././Img/speedometer.png";

  let needleImg: HTMLImageElement = new Image;
  needleImg.src = "././Img/needle.png";

  let coinImg: HTMLImageElement = new Image;
  coinImg.src = "././Img/coin.png";

  /// RUNTIME VALUES \\\
  let jirkaMode: boolean = false;

  window.addEventListener("load", init);
  document.addEventListener("interactiveViewportStarted", <EventListener><unknown>start);
  let dialog: HTMLDialogElement;

  function init(_event: Event): void {
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

  async function startInteractiveViewport(): Promise<void> {
    // load resources referenced in the link-tag
    await FudgeCore.Project.loadResourcesFromHTML();
    FudgeCore.Debug.log("Project:", FudgeCore.Project.resources);
    // pick the graph to show
    graph = <ƒ.Graph>FudgeCore.Project.resources["Graph|2022-05-18T20:10:05.727Z|72077"];
    FudgeCore.Debug.log("Graph:", graph);
    if (!graph) {
      alert("Nothing to render. Create a graph with at least a mesh, material and probably some light");
      return;
    }
    // setup the viewport
    let cmpCamera: ƒ.ComponentCamera = new FudgeCore.ComponentCamera();
    canvas = document.querySelector("canvas");
    viewport = new FudgeCore.Viewport();
    viewport.initialize("InteractiveViewport", graph, cmpCamera, canvas);
    canvas.addEventListener("mousedown", enterPointerLock);
    window.addEventListener("keydown", hndKeydown);
    viewport.draw();
    canvas.dispatchEvent(new CustomEvent("interactiveViewportStarted", { bubbles: true, detail: viewport }));
  }


  async function start(_event: CustomEvent): Promise<void> {
    let response: Response = await fetch("config.json");
    config = await response.json();
    initValues();
    gamestate = new GameState();
    world = new World(config, graph.getChildrenByName("World")[0], gamestate);
    setupCar();
    setupPolice();
    setupCam();
    setupAudio();

    ƒ.Loop.addEventListener(ƒ.EVENT.LOOP_FRAME, update);
    ƒ.Loop.start();  // start the game loop to continously draw the viewport, update the audiosystem and drive the physics i/a
  }

  function update(_event: Event): void {
    world.update();
    if (state == 1) {
      car.update();
    }
    if (state != 0) {
      policeCar.update();
    }
    cam.update(car.getCamPos());
    updateGameState();
    ƒ.Physics.simulate();  // if physics is included and used
    ƒ.AudioManager.default.update();
    renderScreen();
  }

  function updateGameState(): void {
    if (policeCar.hasHim() && state == 1) {
      state = 2;
      console.log("I hope you like beans Bud!");
    }
    if (car.isOutOfFuel() && state == 1) {
      state = 3;
      console.log("He is dry lads!");
    }
  }

  function renderScreen(): void {
    viewport.draw();
    renderVUI();
  }

  function renderVUI(): void {
    // Coins
    let f: number = canvas.height * config.speedometerHeight;
    crc2.textAlign = "left";
    crc2.fillStyle = "#fff";
    crc2.font = f * 0.2 + "px AGENCYB";
    if (!jirkaMode) {
      crc2.drawImage(coinImg, f / 4, canvas.height - f * 0.46, f / 3, f / 3);
      crc2.font = f * 0.2 + "px AGENCYB";
      crc2.lineWidth = f * 0.05;
      crc2.strokeText("" + car.getScore(), f * 0.5, canvas.height - f * 0.1);
      crc2.fillText("" + car.getScore(), f * 0.5, canvas.height - f * 0.1);
    }
    // Speedometer and Gaz
    crc2.save();
    crc2.resetTransform();
    crc2.fillStyle = "#000";
    crc2.fillRect(canvas.width - f * 0.8, canvas.height - f * 0.7, f * 0.5, f * 0.5);
    crc2.fillStyle = "#444";
    crc2.fillRect(canvas.width - f * 0.69, canvas.height - f * 0.6, f * 0.3 * (car.getGazPercent() / 100), f * 0.2);      //Tankanzeigebalken
    crc2.drawImage(speedImg, canvas.width - f, canvas.height - f, f, f);
    crc2.translate(canvas.width - f * 0.53, canvas.height - f * 0.34);
    let x1: number = 0;
    let x2: number = -45;
    let y1: number = 180;
    let y2: number = 225;
    let rot: number = (Math.abs(car.getSpeedPercent()) * 180 - x1) * (y2 - x2) / (y1 - x1) + x2;
    crc2.rotate(rot * Math.PI / 180);
    crc2.drawImage(needleImg, -f * 0.45, -f / 16, f / 2, f / 8);
    crc2.restore();

    // Countdown
    if (policeCar.isCounting()) {
      crc2.fillStyle = "#fff";
      crc2.font = f * 0.5 + "px AGENCYB";
      crc2.lineWidth = f * 0.1;
      crc2.textAlign = "center";
      crc2.strokeText("" + policeCar.getCountdown(), canvas.width / 2, canvas.height / 2);
      crc2.fillText("" + policeCar.getCountdown(), canvas.width / 2, canvas.height / 2);
    }

    drawMenu(f);
  }

  function drawMenu(f: number): void {
    if (state > 1) {
      let heading: string;
      if(state == 2){
        heading = "YOU HAVE BEEN CAUGHT";
      }else if(state == 3){
        heading = "YOUR TANK HAS RUN DRY";
      }
      crc2.textAlign = "center";
      crc2.fillStyle = "#000";
      crc2.globalAlpha = 0.7;
      crc2.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);
      crc2.globalAlpha = 1;
      crc2.fillStyle = "#fff";
      crc2.font = f * 0.25 + "px AGENCYB";
      crc2.fillText(heading, canvas.width / 2, canvas.height * 0.35);
      crc2.font = f * 0.2 + "px AGENCYB";
      crc2.fillText("Score: " + car.getScore(), canvas.width / 2, canvas.height * 0.45);
      crc2.font = f * 0.15 + "px AGENCYB";
      crc2.fillText("Thanks for Playing! Press F5 to restart 0:)", canvas.width / 2, canvas.height * 0.65);
    }
  }

  function enterPointerLock(): void {
    canvas.requestPointerLock();
    lockMode = false;
  }

  function hndKeydown(_key: KeyboardEvent): void {
    switch (_key.code) {
      case "KeyM":
        lockMode = true;
        document.exitPointerLock();
        break;
      case "KeyJ":
        jirkaMode = !jirkaMode;
        if (jirkaMode) {
          document.getElementById("vui").style.visibility = "visible";
        } else {
          document.getElementById("vui").style.visibility = "hidden";
        }
    }
  }


  function initValues(): void {
    graph = viewport.getBranch();
    crc2 = canvas.getContext("2d");
  }

  function setupCar(): void {
    carNode = graph.getChildren()[0];
    car = new PlayerCar(config, carNode, world);
  }

  function setupPolice(): void {
    policeCarNode = graph.getChildrenByName("Police")[0].getChildrenByName("Cars")[0].getChildren()[0];
    policeCarNode.addEventListener("gottcha", (_e: CustomEvent) =>
      console.log(_e.detail.message));
    policeCar = new PoliceCar(config, policeCarNode, car);
  }

  function setupCam(): void {
    //viewport.camera = cmpCamera = carNode.getChildrenByName("PlayerMain")[0].getChildrenByName("testcam")[0].getComponent(ƒ.ComponentCamera);
    camNode = graph.getChildrenByName("NewCam")[0];
    viewport.camera = cmpCamera = camNode.getChildren()[0].getChildren()[0].getChildren()[0].getChildren()[0].getComponent(ƒ.ComponentCamera);
    cam = new Cam(camNode, car.getPosition(), config);
  }

  function setupAudio(): void {
    ƒ.AudioManager.default.listenTo(graph);
    ƒ.AudioManager.default.listenWith(carNode.getChild(0).getChildrenByName("Audio")[0].getComponent(ƒ.ComponentAudioListener));
  }
}