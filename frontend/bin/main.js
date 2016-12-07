(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
 "use strict";
 /*jslint browser:true */
 /*jslint node:true */

/**
 * Ball prototype. We bounce an image on screen representing the ball
 *
 * @constructor
 * @param {string} id_Ball - html id property identifiyng ball
 * @param {Context} context_ - An instance of game context that let you traverse all game objects
 * @tutorial bouncing-ball-tutorial
 */

var Ball = function (id_Ball,context_) {
  this.imageBallView = document.getElementById(id_Ball);
  this.state = "stop"; //startdbl,startclick

  this.ballX = 0; this.ballY = 0;   // position
  this.ballVx = 0; this.ballVy = 0; // velocity & direction

  this.context = context_;
  this.imageBallView.width = this.context.viewPortHeight*0.05;
  this.count=0;
};

Ball.prototype.scaleAndRealocate = function(){
  this.imageBallView.width = this.context.viewPortHeight*0.05;
};

/** Get ball coordinates */
Ball.prototype.getPosition = function(){
     return {x:parseInt(this.imageBallView.style.left),y:parseInt(this.imageBallView.style.top)};
};

/** Simply change direction sense and do an angle correction depending where ball have hit the stick
*   @param {number} stickRelativeBallHitPoint - If we hit on upper middle stick percentage positive otherwise negative we use this value to change ballVy
*/
Ball.prototype.bounce = function(stickRelativeBallHitPoint){
      this.ballVy += (stickRelativeBallHitPoint/100);
      if (this.ballVy > 1) this.ballVy = 1;
      if (this.ballVy < -1) this.ballVy = -1;
      this.ballVx = -this.ballVx;
      this.count++;
      console.log(this.count);
};

/** We put ball in X,Y coordinates and check boundaries in order to change direction */
Ball.prototype.locate = function(x,y){
    this.ballX = x;
    this.ballY = y;
    //Ball get out of boundaries in top or bottom edges
    if (y<=0 || y>=this.context.viewPortHeight-this.imageBallView.height){
        //If we reach top or bottom and directions have not been yet inverted we do it.We avoid annoying bug with multiple repeated bouncings on edges
        if ( (y <= 0 && this.ballVy <0 ) || (y>=this.context.viewPortHeight-this.imageBallView.height && this.ballVy >0) )
            this.ballVy = -this.ballVy;
    }

    this.imageBallView.style.left = (Math.round(x))+ 'px';
    this.imageBallView.style.top = (Math.round(y)) + 'px';

    //Ball notifies all observers if is under 25% viewport width or 75% onwards. Think it twice! Do we need patterns overburden for this game?
    if (x<((25*this.context.viewPortWidth)/100) || x> ((75*this.context.viewPortWidth)/100)){
        this.context.stick.Update(this);
        this.context.stick2.Update(this);
    }
 };

/** We RAMDOMLY choose ball direction and speed
* in this method and try not allow angles greater than 45 degrees in any
* of the four quarters
*/
Ball.prototype.ramdomDepartureAngle = function(){
    this.count = 0;
    this.ballVx = 1;
    this.ballVy = Math.round(Math.random() * 100)/100;

    if (Math.round(Math.random()) === 0) this.ballVx = -this.ballVx;
    if (Math.round(Math.random()) === 0) this.ballVy = -this.ballVy;
};

module.exports = Ball;

},{}],2:[function(require,module,exports){
"use strict";
/*jslint browser:true */
/*jslint node:true */

var ball = require('./ball');
var stick = require('./stick');

var animate;
/**
 * Context prototype.
 * With this object (Singleton) by the way. We manage game context: points, on/off, balls location
 * on screen. It is a bridge that let you traverse whole game objects
 *
 * @constructor
 */
function Context(){
  this.score=0;
  this.state = "stop"; //STOP OR RUN
  this.speed = 1.8; //1 - 20;
  this.restart();
  var self = this; //Trick to run setInterval properly
  this.initWebSockets();

  this.getContextSelf = function(){return self;};
  //If both paddles are autopilot we start the game directly
  if (this.stick.autopilot && this.stick2.autopilot) this.start();
}

Context.prototype.initWebSockets = function(){
    this.socket = io(); //Third party lib loaded on html not included with require


    this.socket.on('stick id and position',function(msg){
        console.log(msg);
    });
    this.socket.on('ball position',function(msg){
        console.log(msg);
    });
};

/** Restart pong game after a resizing event*/
Context.prototype.restart = function(){
    this.viewPortWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth; //ViewportX
    this.viewPortHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;//ViewportY
    this.speed = this.viewPortWidth/1000;
    console.log(this.viewPortWidth+ " speed = "+this.speed);
    if (this.ball && this.stick && this.stick2) {
      this.ball.scaleAndRealocate();
      this.stick.scaleAndRealocate();
      this.stick2.scaleAndRealocate();
    }else{
      this.ball = new ball("bola",this);
      this.stick = new stick("stick","left",this,true);
      this.stick2 = new stick("stick2","right",this,true);
    }

    /** We put ball in the middle of the screen */
    this.ball.locate((this.viewPortWidth/2)-(this.ball.imageBallView.width/2),(this.viewPortHeight/2)-this.ball.imageBallView.height);
    /** Vertical dotted separator decoration */
    var verticalSeparator = document.getElementById("vertical");
    var verticalSeparatorWidth = this.viewPortWidth * 0.02;
    verticalSeparator.setAttribute("style","left:"+(this.viewPortWidth/2-verticalSeparatorWidth/2)+";border-left: "+verticalSeparatorWidth+"px dotted #444; ");
};

Context.prototype.increaseSpeed = function(){
  if(this.ball.count==4){
    this.ball.count=0;
    if(this.speed>=2){
      this.speed=2;
    }else{
    this.speed=this.speed+0.1;
  }
    console.log(this.speed);
  }
};

Context.prototype.showBanner = function(message,millis){
   var  bannerEl = document.getElementById("banner");
   bannerEl.style.display = "block";
   bannerEl.innerHTML = message;
   if (millis && (millis !== 0))
    setInterval(this.hideBanner,millis);
};

/** Hide game informative Banner */
Context.prototype.hideBanner = function(){
    var  bannerEl = document.getElementById("banner");
    bannerEl.style.display = "none";
};

/** Start pong game */
Context.prototype.start = function(){
    //this.state = "run";
    this.viewPortWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth; //ViewportX
    this.speed = this.viewPortWidth/1000;
    var self = this.getContextSelf();
    self.state = "run";
    self.ball.ramdomDepartureAngle();
    self.lastTime = new Date();
    animate=setInterval(function(){self.animate();}, 1);
};

/** Reset pong game scores*/
Context.prototype.resetScores = function(){
   this.stick.score = 0;
   this.stick2.score = 0;
   var scoreLeftEl = document.getElementById("scorePlayerLeft");
   var scoreRightEl = document.getElementById("scorePlayerRight");
   scoreLeftEl.innerHTML = this.stick.score;
   scoreRightEl.innerHTML = this.stick2.score;
};

/** Stop pong game */
Context.prototype.stop = function(){
    this.state = "stop";
    clearTimeout(animate);
    //if (this.stick.autopilot && this.stick2.autopilot) this.start();
    this.start();
};

/** Animate one new game frame */
Context.prototype.animate =function(){
    if (this.stick.autopilot) this.processAI(this.stick);
    if (this.stick2.autopilot) this.processAI(this.stick2);

    var currTime = new Date();
    var millis = currTime.getTime() - this.lastTime.getTime();
    this.lastTime = currTime;
    var ball_ = this.ball;
    ball_.locate(ball_.ballX + ((ball_.ballVx*millis)*this.speed) , ball_.ballY + ((ball_.ballVy*millis)*this.speed) );
};

/** Arificial intelligence behind stick movements when it is autopiloted by the computer */
Context.prototype.processAI = function(stick_){
    var stickPos = stick_.getPosition();
    var StickMAXSPEED = 10; //Max pixel speed per frame
    var stickVy = 1;
    var iamLeftStickAndBallIsCloseAndTowardsMe = (stick_.sideLocation === "left" && (this.ball.ballX < (this.viewPortWidth/2)) && (this.ball.ballVx < 0) );
    var iamRightStickAndBallIsCloseAndTowardsMe = (stick_.sideLocation === "right" && (this.ball.ballX > (this.viewPortWidth/2)) && (this.ball.ballVx > 0) );

    if (iamLeftStickAndBallIsCloseAndTowardsMe || iamRightStickAndBallIsCloseAndTowardsMe) {
                var timeTilCollision = ((this.viewPortWidth-stick_.gap-stick_.imageStickView.width) - this.ball.ballX) / (this.ball.ballVx);
                if (stick_.sideLocation === "left") timeTilCollision = ((stick_.imageStickView.width+stick_.gap) - this.ball.ballX) / (this.ball.ballVx);

                var distanceWanted = (stickPos.y+(stick_.imageStickView.height/2)) - (this.ball.ballY+(this.ball.imageBallView.width/2));
                var velocityWanted = -distanceWanted / timeTilCollision;
                if(velocityWanted > StickMAXSPEED)
                    stickVy = StickMAXSPEED;
                else if(velocityWanted < -StickMAXSPEED)
                    stickVy = -StickMAXSPEED;
                else
                    stickVy = velocityWanted*3;
                stick_.locate(stickPos.x,stick_.stickY + stickVy);
    }
};

module.exports = Context;

},{"./ball":1,"./stick":5}],3:[function(require,module,exports){
"use strict";
/*jslint browser:true */
/*jslint node:true */

/**
 *  Pong main entry script
 *  @author Pere Crespo <pedcremo@iestacio.com>
 *  @version 0.0.1
 */

/** Prototype where all game objects are present and could be accessed */
var singletonContext = require('./patterns/singleton/singletonContext');
/** Game utils */
var utils = require('./utils');

/** Once the page has been completely loaded. Including images. We start the game logic */
window.onload=function(){

    var GameContext_ = singletonContext.getInstance();

    var startOrStopGame=function(event){
        if (GameContext_.state.match("run")){
          GameContext_.stop();
        }else{
          GameContext_.start();
        }
    };
    /** We check if player has chosen a nickname(mandatory) and a Picture Profile (optional). We store them as cookie and LocalStorage respectively
     If there is not profile we can not start the game otherwise we can start or stop the game pressing any key */
    utils.checkIfProfileHasBeenDefined(function(){  window.addEventListener("keypress",startOrStopGame,false);});
    /** On windows resize event we restart context to resize and realocate game elements into the new viewport */
    window.onresize = function() {
        GameContext_.restart();
    };
};

},{"./patterns/singleton/singletonContext":4,"./utils":6}],4:[function(require,module,exports){
"use strict";

/*jslint browser:true */
/*jslint node:true */

/**
 *  Singleton pattern aplied to context
 */
var context = require('./../../context');

var SingletonContext = (function () {
    var instance;

    function createInstance() {
        var object = new context();
        return object;
    }

    return {
        getInstance: function () {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();

module.exports = SingletonContext;

},{"./../../context":2}],5:[function(require,module,exports){
"use strict";
/*jslint browser:true */
/*jslint node:true */

//var withObserver = require('./patterns/observer/Observer');

/**
 * Create an instance of Stick.
 * This object let you move vertically using mouse pointer movements and hit the ball.
 *
 * @constructor
 * @param {string} id_stick - HTML Id attribute used to identify the stick
 * @param {string} sideLocation - Possible values "left" or "right"
 * @param {Context} context - An instance of game context that let you traverse all game objects
 * @param {boolean} autopilot - If true computer manage stick movement
 */

function Stick(id_stick,sideLocation,context,autopilot) {
  this.autopilot = autopilot || false;  //If true computer moves the stick automatically
  this.imageStickView = document.getElementById(id_stick); //We get from index.html the image associated with the stick
  this.score = 0;
  this.sideLocation = sideLocation || "left" ; //right or left,
  this.gap = 50;    //Distance in pixels from sideLocation
  this.context = context;
  this.imageStickView.height = this.context.viewPortHeight*0.2;

  this.stickY = 0;   // position
  this.stickVy = 0; // velocity & direction

  if (this.sideLocation == "left"){
      this.locate(this.gap,Math.round(this.context.viewPortHeight/2));
  }else{
      //this.imageStickView.style.left=this.context.viewPortWidth-this.imageStickView.width-this.gap;
      this.locate(this.context.viewPortWidth-this.imageStickView.width-this.gap,Math.round(this.context.viewPortHeight/2));
  }

  var self = this;

  /** USED IN PCs: We move stick on y axis following mouse pointer location */
  window.addEventListener("mousemove",
    function(e){
      var y= (window.Event) ? e.pageY : event.clientY + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);
      if (!self.autopilot) self.locate(self.x,y-(self.imageStickView.height/2));
  },false);

  /** USED IN TABLETS AND SMARTPHONES: We move stick on y axis following finger touching location */
  window.addEventListener("touchmove",
    function(e){
      var y=  e.touches[0].pageY;
      //console.log("y = "+y);
      if (!self.autopilot) self.locate(self.x,y-(self.imageStickView.height/2));
  },false);

  //Used in computers
  this.imageStickView.addEventListener("mousedown",function(e){e.preventDefault();self.autopilot=false;self.context.hideBanner()});
  window.addEventListener("mouseup",function(e){self.autopilot=true;self.context.showBanner("You should drag any stick with mouse or finger if you want to controll it")});
  //Used in tablets and smartphones
  this.imageStickView.addEventListener("touchstart",function(e){e.preventDefault();self.autopilot=false;self.context.hideBanner()});
  window.addEventListener("touchend",function(e){self.autopilot=true;self.context.showBanner("You should drag any stick with mouse or finger if you want to controll it")});

  /** As an Observer we should implement this mandatory method. Called
  *   everytime the object we observe (in this case ball) call to Notify Subject method
  */
  this.Update = function (ball){

      var ballPosition = ball.getPosition();
      var stickPosition = this.getPosition();

      var speed = context.increaseSpeed();

      var ballCloseStickLeftAndTowardsIt = (this.sideLocation == "left" && ((ballPosition.x + ball.ballVx) <= stickPosition.x+this.imageStickView.width) && ball.ballVx < 0);
      var ballCloseStickRightAndTowardsIt = (this.sideLocation == "right" && ((ballPosition.x + ball.ballVx + ball.imageBallView.width) >= stickPosition.x)) && ball.ballVx > 0;

      if (  ballCloseStickLeftAndTowardsIt || ballCloseStickRightAndTowardsIt) {
          var distance = (stickPosition.y+this.imageStickView.height/2)-(ballPosition.y+ball.imageBallView.height/2);
          var minDistAllowed = (this.imageStickView.height/2+ball.imageBallView.height/2);
          if (Math.abs(distance) < minDistAllowed) {
                ball.bounce(distance*100/minDistAllowed);
          }else{
            if ((ballPosition.x <= 0) || (ballPosition.x >= this.context.viewPortWidth)){
                this.context.stop();
                if (this.sideLocation=="left"){
                    this.context.stick2.increaseScore();
                    if (this.context.stick2.score > 9) this.context.resetScores();
                }else{
                    this.context.stick.increaseScore();
                    if (this.context.stick.score > 9) this.context.resetScores();
                }

                //We locate ball on center
                this.context.ball.locate((this.context.viewPortWidth/2)-this.context.ball.imageBallView.width,(this.context.viewPortHeight/2)-this.context.ball.imageBallView.height);  //Posicionem pilota al mig
            }
          }
      }
  };
}

/** Increase stick player owner score in one point */
Stick.prototype.increaseScore = function(){
     this.score+=1;
     var scoreEl = document.getElementById("scorePlayerLeft");
     if (this.sideLocation === "right"){
         scoreEl = document.getElementById("scorePlayerRight");
     }
     scoreEl.innerHTML = this.score;
};

/** For scaling game objects (ball, sticks ...) when viewport changes*/
Stick.prototype.scaleAndRealocate = function(){
  this.imageStickView.height = this.context.viewPortHeight*0.2;
  if (this.sideLocation == "left"){
    this.imageStickView.style.left=this.gap+'px';
  }else{
    this.imageStickView.style.left=this.context.viewPortWidth-this.imageStickView.width-this.gap;
  }
};

/** Draw and locate stick on screen using x,y coordinates */
Stick.prototype.locate = function(x,y){
    this.stickY = y;
    if (this.stickY < 0 ) this.stickY =0;
    if (this.stickY > (this.context.viewPortHeight - this.imageStickView.height)) this.stickY = this.context.viewPortHeight - this.imageStickView.height;
    this.imageStickView.style.left = (Math.round(x))+ 'px';
    this.imageStickView.style.top = (Math.round(this.stickY)) + 'px';

    if (!this.autopilot){
        var newPosition = this.getPosition();
        if (this.oldPosition !== newPosition){
         this.context.socket.emit("stick id and position","{stick:''"+this.sideLocation+"'"+JSON.stringify(newPosition)+"}");
        }
    }
    this.oldPosition  = this.getPosition();
};

/** Get stick x,y pixel location on screen */
Stick.prototype.getPosition = function(){
     return {x:parseInt(this.imageStickView.style.left),y:parseInt(this.imageStickView.style.top)};
};

/** We export whole prototype */
module.exports = Stick;

},{}],6:[function(require,module,exports){
"use strict";
/*jslint browser:true */
/*jslint node:true */

/**
 * Utils module.
 * @module utils
 * @see module:utils
 */

function setCookie(cname, cvalue, exdays) {
    if (cvalue && cvalue!== ""){
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function showPlayerProfile(){
  var user = getCookie("username");
  if (user && user!==""){
    var nicknameElement=document.getElementById("playerLeft");
    nicknameElement.innerHTML= user;
    var dataImage = localStorage.getItem('imgData');
    if (dataImage){
      var profileImg=document.createElement("img");
      profileImg.src = "data:image/png;base64," + dataImage;
      profileImg.width=48;
      profileImg.height=64;
      nicknameElement.parentNode.insertBefore(profileImg,nicknameElement);
    }
    return true;
  }else{
    return false;
  }
}

function checkIfProfileHasBeenDefined(addGameKeyBindings) {

    var user = getCookie("username");
    if (user !== "") {
        showPlayerProfile();
        addGameKeyBindings();
    } else {
        $.get("templates/modal-player-profile.html",function(data,status){
                $('body').append(data);
                // Get the modal
                var modal = document.getElementById('myModal');
                document.getElementById('blah').style.display="none";
                // Get the <span> element that closes the modal
                var span = document.getElementsByClassName("close")[0];
                span.onclick = function() {
                    if (showPlayerProfile()){
                      modal.style.display = "none";
                      addGameKeyBindings();
                    }
                };
                window.onclick = function(event) {
                  if (event.target == modal) {
                    if (showPlayerProfile()){
                      modal.style.display = "none";
                      addGameKeyBindings();
                    }
                  }
                };
                modal.style.display = "block";

                var nickname = document.getElementById("nickname_");
                nickname.addEventListener("change",function(){setCookie("username", nickname.value, 365);});
                nickname.addEventListener("blur",function(){setCookie("username", nickname.value, 365);});
                nickname.addEventListener("focus",function(){setCookie("username", nickname.value, 365);});

                var imgProfile = document.getElementById("imgProfile");
                imgProfile.addEventListener("change",function(){readFileAndPreviewFromLocalFileSystem(this);});
         });
    }
    document.getElementById("playerRight").innerHTML= "Computer";
}

//Encode an image using base64 previously to store it on LocalStorage
//Note: In HTML the img tag can load an image pointing src attribute to an URL or putting there the image in base64
function getBase64Image(img) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0,48,64);

    var dataURL = canvas.toDataURL("image/jpg");

    return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}
//We convert before saving to base64
function saveImageToLocalStorage(){
  var bannerImage = document.getElementById('blah');
  var imgData = getBase64Image(bannerImage);
  localStorage.setItem("imgData", imgData);
}

//We choose a image profile from local system and we do a preview
function readFileAndPreviewFromLocalFileSystem(input) {
  if (input.files && input.files[0]) {
      document.getElementById('blah').style.display="block";
      var reader = new FileReader();
      reader.onload = function (e) {
        document.getElementById("blah").src=e.target.result;
        saveImageToLocalStorage();
      };
      reader.readAsDataURL(input.files[0]);
  }
}
/** Before start any game we check if user has defined a profile. */
 module.exports.checkIfProfileHasBeenDefined = checkIfProfileHasBeenDefined;

},{}]},{},[3])