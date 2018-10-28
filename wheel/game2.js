var urlParams = new URLSearchParams(window.location.search);
var dataSrcStr = urlParams.get('data');
var dataSrc = JSON.parse(dataSrcStr)
checkDataSrc(dataSrc);

// the game itself
var game;

var defaultColors = [
    0x88bb00,
    0x0088bb,
    0x8800bb,
    0xbb0088,
    0xbbbb88,
    0x88bbbb,
    0xbb88bb,
    0x8888bb,
    0xbb8888
]

var winIndex = dataSrc.slices.findIndex(slice => slice.id === dataSrc.winId)

var gameOptions = {
    // slices configuration
    slices: dataSrc.slices,
    // wheel rotation duration range, in milliseconds
    rotationTimeRange: {
        min: 3000,
        max: 4500
    },

    // wheel rounds before it stops
    wheelRounds: {
        min: dataSrc.wheelRounds,
        max: dataSrc.wheelRounds
    },

    spinDegree: {
        min: 360 - findWinAngleMin(dataSrc.slices, winIndex),
        max: 360 - findWinAngleMax(dataSrc.slices, winIndex)
    },

    // degrees the wheel will rotate in the opposite direction before it stops
    backSpin: {
        min: 0,
        max: 0
    },

    // wheel radius, in pixels
    wheelRadius: 240,

    // color of stroke lines
    strokeColor: 0xffffff,

    // width of stroke lines
    strokeWidth: 2,

    winMessage: dataSrc.winMessage
}

// once the window loads...
window.onload = function() {

    // game configuration object
    var gameConfig = {

        // render type
       type: Phaser.CANVAS,

       // game width, in pixels
       width: 600,

       // game height, in pixels
       height: 600,

       // game background color
       backgroundColor: 0xffffff,

       // scenes used by the game
       scene: [playGame]
    };

    // game constructor
    game = new Phaser.Game(gameConfig);

    // pure javascript to give focus to the page/frame and scale the game
    window.focus()
    resize();
    window.addEventListener("resize", resize, false);
}

// PlayGame scene
class playGame extends Phaser.Scene{

    // constructor
    constructor(){
        super("PlayGame");
    }

    // method to be executed when the scene preloads
    preload(){

        // loading pin image
        this.load.image("pin", "pin.png");

        // loading icons spritesheet
        this.load.spritesheet("icons", "icons.png", {
            frameWidth: 256,
            frameHeight: 256
        });

    }

    // method to be executed once the scene has been created
    create(){

        // starting degrees
        var startDegrees = -90;
    

        // making a graphic object without adding it to the game
        var graphics = this.make.graphics({
            x: 0,
            y: 0,
            add: false
        });

        // adding a container to group wheel and icons
        this.wheelContainer = this.add.container(game.config.width / 2, game.config.height / 2);
        this.descriptionContainers = []

        // array which will contain all icons
        var iconArray = [];

        // looping through each slice
        for(var i = 0; i < gameOptions.slices.length; i++){

            // converting colors from 0xRRGGBB format to Color objects
            var ringColor = Phaser.Display.Color.ValueToColor(defaultColors[i]);
            var ringColorString = Phaser.Display.Color.RGBToString(Math.round(ringColor.r), Math.round(ringColor.g), Math.round(ringColor.b), 0, "0x");
            graphics.fillStyle(ringColorString, 1);
            graphics.slice(
                gameOptions.wheelRadius + gameOptions.strokeWidth, 
                gameOptions.wheelRadius + gameOptions.strokeWidth, 
                gameOptions.wheelRadius, 
                Phaser.Math.DegToRad(startDegrees), 
                Phaser.Math.DegToRad(startDegrees + gameOptions.slices[i].degrees), 
                false
            );
            graphics.fillPath();

            // setting line style
            graphics.lineStyle(
                gameOptions.strokeWidth, 
                gameOptions.strokeColor, 
                1
            );

            // drawing the biggest slice
            graphics.slice(
                gameOptions.wheelRadius + gameOptions.strokeWidth, 
                gameOptions.wheelRadius + gameOptions.strokeWidth, 
                gameOptions.wheelRadius, 
                Phaser.Math.DegToRad(startDegrees), 
                Phaser.Math.DegToRad(startDegrees + gameOptions.slices[i].degrees), 
                false
            );

            // stroking the slice
            graphics.strokePath();

            // adding the icon
            /*
            var icon = this.add.image(
                gameOptions.wheelRadius * 0.75 * Math.cos(Phaser.Math.DegToRad(startDegrees + gameOptions.slices[i].degrees / 2)), 
                gameOptions.wheelRadius * 0.75 * Math.sin(Phaser.Math.DegToRad(startDegrees + gameOptions.slices[i].degrees / 2)), 
                "icons", 
                gameOptions.slices[i].iconFrame
            );
            */

            var descriptionContainer = this.add.container(
                gameOptions.wheelRadius * 0.75 * Math.cos(Phaser.Math.DegToRad(startDegrees + gameOptions.slices[i].degrees *0.4)),
                gameOptions.wheelRadius * 0.75 * Math.sin(Phaser.Math.DegToRad(startDegrees + gameOptions.slices[i].degrees *0.4)),
            );
            var testText = this.add.text(0,0, gameOptions.slices[i].text, 
                {
                    font: "bold 20px Arial",
                    align: "left",
                    color: "white"
                })
            descriptionContainer.add(testText);
            descriptionContainer.angle = startDegrees + gameOptions.slices[i].degrees / 2 + 90;

            this.descriptionContainers.push(descriptionContainer)

            // updating degrees
            startDegrees += gameOptions.slices[i].degrees;

        }

        // generate a texture called "wheel" from graphics data
        graphics.generateTexture("wheel", (gameOptions.wheelRadius + gameOptions.strokeWidth) * 2, (gameOptions.wheelRadius + gameOptions.strokeWidth) * 2);

        // creating a sprite with wheel image as if it was a preloaded image
        var wheel = this.add.sprite(0, 0, "wheel");

        // adding the wheel to the container
        this.wheelContainer.add(wheel);

        // adding all iconArray items to the container
        //this.wheelContainer.add(iconArray);
        this.wheelContainer.add(this.descriptionContainers);


        // adding the pin in the middle of the canvas
        this.pin = this.add.sprite(game.config.width / 2, game.config.height / 2, "pin");

        // adding the text field
        this.prizeText = this.add.text(
            game.config.width / 2, 
            game.config.height - 20, 
            "Spin the wheel", 
            {
                font: "bold 32px Arial",
                align: "center",
                color: "white"
            }
        );

        // center the text
        this.prizeText.setOrigin(0.5);

        // the game has just started = we can spin the wheel
        this.canSpin = true;

        // waiting for your input, then calling "spinWheel" function
        this.input.on("pointerdown", this.spinWheel, this);
    }

    // function to spin the wheel
    spinWheel(){

        // can we spin the wheel?
        if(this.canSpin){

            // resetting text field
            this.prizeText.setText("");

            // the wheel will spin round for some times. This is just coreography
            var rounds = Phaser.Math.Between(gameOptions.wheelRounds.min, gameOptions.wheelRounds.max);

            // then will rotate by a random number from 0 to 360 degrees. This is the actual spin
            var degrees = Phaser.Math.Between(gameOptions.spinDegree.min, gameOptions.spinDegree.max);

            // then will rotate back by a random amount of degrees
            var backDegrees = Phaser.Math.Between(gameOptions.backSpin.min, gameOptions.backSpin.max);

            // before the wheel ends spinning, we already know the prize
            var prizeDegree = 0;

            // looping through slices
            for(var i = gameOptions.slices.length - 1; i >= 0; i--){

                // adding current slice angle to prizeDegree
                prizeDegree += gameOptions.slices[i].degrees;

                // if it's greater than the random angle...
                if(prizeDegree > degrees - backDegrees){

                    // we found the prize
                    var prize = i;
                    break;
                }
            }

            // now the wheel cannot spin because it's already spinning
            this.canSpin = false;

            // animation tweeen for the spin: duration 3s, will rotate by (360 * rounds + degrees) degrees
            // the quadratic easing will simulate friction
            this.tweens.add({

                // adding the wheel container to tween targets
                targets: [this.wheelContainer],

                // angle destination
                angle: 360 * rounds + degrees,

                // tween duration
                duration: Phaser.Math.Between(gameOptions.rotationTimeRange.min, gameOptions.rotationTimeRange.max),

                // tween easing
                ease: "Cubic.easeOut",

                // callback scope
                callbackScope: this,

                // function to be executed once the tween has been completed
                onComplete: function(tween){

                    // another tween to rotate a bit in the opposite direction
                    this.tweens.add({
                        targets: [this.wheelContainer],
                        angle: this.wheelContainer.angle - backDegrees,
                        duration: Phaser.Math.Between(gameOptions.rotationTimeRange.min, gameOptions.rotationTimeRange.max) / 2,
                        ease: "Cubic.easeIn",
                        callbackScope: this,
                        onComplete: function(tween){
                            swal({ 
                                title: gameOptions.winMessage,
                                confirmButtonColor: '#3085d6',
                                confirmButtonText: 'Proceed!'
                            }).then(function(result) {
                                if (result.value) {
                                    parent.postMessage("message", "*")
                                }
                            })
                        }
                    })
                }
            });
        }
    }
}

// pure javascript to scale the game
function resize() {
    var canvas = document.querySelector("canvas");
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var windowRatio = windowWidth / windowHeight;
    var gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else{
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}


function findWinAngleMin (slices, winIndex){
    let winAngleMin = 0;
    for (var i=0; i <= winIndex-1; i++){
        winAngleMin += slices[i].degrees
        console.log("winAngleMin", winAngleMin);
    }
    return winAngleMin
}

function findWinAngleMax (slices, winIndex){
    let winAngleMax = 0;
    for (var i=0; i <= winIndex; i++){
        winAngleMax += slices[i].degrees
        console.log("winAngleMax", winAngleMax);

    }
    return winAngleMax
}

function checkDataSrc(dataSrc){
    if(!dataSrc.slices || !Array.isArray(dataSrc.slices) ) throw new Error('dataSrc require property slices as an array')
    if(!dataSrc.slices[0].id || !dataSrc.slices[0].text || !dataSrc.slices[0].degrees) throw new Error('each slice require id, text, degrees')
    if(!dataSrc.winMessage) throw new Error('dataSrc require winMessage property')
    if(!dataSrc.wheelRounds) throw new Error('dataSrc require property wheelRounds')
    if(!dataSrc.winId) throw new Error('ataSrc require property wheelRounds winId')
}