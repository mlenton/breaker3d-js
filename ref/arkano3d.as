package {
/* todo
 * difficulty
 * 
 */
	import caurina.transitions.Tweener;
	
	import flash.display.Sprite;
	import flash.events.Event;

	import flash.text.StyleSheet;
    import flash.text.TextField;
	import flash.text.TextFormat;
    import flash.text.TextFieldType;

    import flash.media.Sound;
    import flash.net.URLRequest;
	
	import sandy.core.Scene3D;
	import sandy.core.World3D;
	import sandy.core.data.*;
	import sandy.core.scenegraph.*;
	import sandy.materials.*;
	import sandy.parser.*;
	import sandy.primitive.*;

//	[SWF(width="400", height="550", align="center", backgroundColor='#ffffff', frameRate='31')]

	public class arkano3d extends Sprite
	{
		private var world:Scene3D;

		private var room:Room3D;
		private var ballMarker:BallMarker;
		private var tileSpace:TileSpace;

		private var bat:Bat;
		private var ball:Shape3D;
		
		private var ballVector:Vector;
		public var batVector:Vector;

		private var mousecontrol:MouseControl;
		private var keycontrol:KeyboardControl;

		private var isBallReset:Boolean;
		private var isBallOverX:Boolean;
		private var isBallOverZ:Boolean;
		
		private var lineOverMaterial:Appearance; 
		private var lineOutMaterial:Appearance; 

		private var m_nLives:Number;
		
		private var m_nScore:Number;

		private var m_nMultiplier:Number;
		
		private var m_sInstruction:String;

		private var m_nBallSpeed:Number;
		
		private var m_nTilesRemain:Number;
		private var m_nTilesTotal:Number;
				
		private var tileLevels : Array;

		
//        private var tfScore:TextField;
        private var tfScoreLbl:TextField;

//        private var tfTilesRemain:TextField;
//        private var tfTilesTotal:TextField;

//        private var tfLives:TextField;
         
//        protected var tfInstructions:TextField;
//        protected var tfLevel:TextField;
        
//        private var tfMultiplier:TextField;
        
        private var styles:StyleSheet;

//        private var fps:FPS;
        private var tileCount : Number;
        private var m_nGameLevel:Number;
        private var enableRestart:Boolean;
		private var m_nFriction:Number;

		private var batHitSound : SoundBatHit;
		private var tileHitSound : SoundTileHit;
		
		public function getBat() : Shape3D { return bat; }

		public function arkano3d()
		{
			init();
        }

		public function init():void
		{
			batHitSound = new SoundBatHit();
			tileHitSound = new SoundTileHit();
		
			// -- set up the 3d world
			world = World3D.getInstance();
			world.container = this;
			world.root = new Group( "rootGroup" );
			world.camera = new Camera3D( 400, 550, 50, 0, 200 );

			world.camera.y = 0;
			world.camera.z = -65;
//			world.camera.fov = 85;
			world.root.addChild( world.camera );

			lineOverMaterial = new Appearance( new ColorMaterial( 0xd888888, 80, null, new OutlineAttributes(1, 0x00dd00, 33) ) );
			lineOutMaterial = new Appearance( new ColorMaterial( 0x888888, 80, null, new OutlineAttributes(1, 0xffdd00, 33) ) );

			var gameStartSound : SoundGameStart = new SoundGameStart();
			gameStartSound.play();
			
/*			var audio_url:String = "test.mp3";

            var request_audiourl:URLRequest = new URLRequest(audio_url);
            var soundFactory:Sound = new Sound();
            soundFactory.load(request_audiourl);
            soundFactory.play();
*/			
					
			room = new Room3D( "theRoom" );
			world.root.addChild( room );

			ballMarker = new BallMarker( "ballMarker", world );
			
			bat = new Bat("theBat", world );			
			world.root.addChild( bat );

			ball = new Ball( "theBall" ); 	
			world.root.addChild( ball );
			
			styles = new StyleSheet();
			styles.parseCSS("arkano3d.css");
			
           // tfInstructions = createTextField(10, 10, 100, 100);

			m_sInstruction = "arkanoid 3d\nclick to start";
            tfInstructions.text = m_sInstruction;

//            tfLevel = createTextField(10, 30, 100, 100);

            tfLevel.text = "level 0";

			m_nTilesTotal = 0;

//            tfTilesRemain = createTextField(10, 50, 100, 50);

			tfTilesRemain.text = "tiles: " + Math.round( (m_nTilesTotal-m_nTilesRemain)/m_nTilesTotal * 100) + "% ("+ ((m_nTilesTotal-m_nTilesRemain).toString()) + " / " + m_nTilesTotal.toString() + ")";
//            tfTilesRemain.text = m_nScore.toString();

//            tfMultiplier = createTextField(10, 70, 100, 20);

			m_nMultiplier = 1;
            tfMultiplier.text = "x" + m_nMultiplier.toString();

//            tfScore = createTextField(10, 90, 100, 50);
			m_nScore = 0;
            tfScore.text = "score: " + m_nScore.toString() + "";

//            tfLives = createTextField(10, 110, 100, 20);
			m_nLives = 5;
            tfLives.text = "lives: " + m_nLives.toString() + "";

			tileLevels = new Array( 15, 19, 11 );

			makeLevel(1);

			m_nBallSpeed = -0.9;
			isBallReset = true;
			ballVector = new Vector(0,m_nBallSpeed,0);      
			batVector = new Vector(0,0,0);      
			m_nFriction = -15;
			// -- start animating
			addEventListener( Event.ENTER_FRAME, enterFrameHandler );
			mousecontrol = new MouseControl(this);
			keycontrol = new KeyboardControl(this);

			Tweener.addTween( bat, { rotateY:360, time : 1.5, transition : "easeOutExpo",
				onComplete : function():void {  }
			});

		}
		private function makeLevel( p : Number ) : void {
			m_nGameLevel = p;
			m_nBallSpeed = -0.50 - ( p * 0.1 );
			if ( tileSpace ) tileSpace.removeAll();
			//delete tileLevels;
			tileSpace = new TileSpace( "theTileSpace", world, m_nGameLevel, 3, 10, tileLevels );
			m_nTilesRemain = m_nTilesTotal = (Math.pow(3,2)*tileLevels.length); //HACK for root
			tfTilesRemain.text = "tiles: " + Math.round( (m_nTilesTotal-m_nTilesRemain)/m_nTilesTotal * 100) + "% ("+ ((m_nTilesTotal-m_nTilesRemain).toString()) + "/" + m_nTilesTotal.toString() + ")";

/*			if ( m_nGameLevel <= 2 ) {
				for ( i=0; i<m_nGameLevel; i++ ) {
					tileLevels.push( 15 + (5*i));
				}
				//delete tileSpace;
				tileSpace = new TileSpace( "theTileSpace", world, m_nGameLevel, 10, tileLevels );
				m_nTilesRemain = m_nTilesTotal = (Math.pow(m_nGameLevel,2)*(tileLevels.length)); //HACK for root
				tfTilesRemain.text = m_nTilesRemain.toString();
				tfTilesTotal.text = m_nTilesTotal.toString();
			} else {
				for ( i=0; i<m_nGameLevel-2; i++ ) {
					tileLevels.push( 10 + (5*i));
				}
				//delete tileSpace;
				tileSpace = new TileSpace( "theTileSpace", world, 3, 10, tileLevels );
				m_nTilesRemain = m_nTilesTotal = (Math.pow(3,2)*(tileLevels.length)); //HACK for root
				tfTilesRemain.text = m_nTilesRemain.toString();
				tfTilesTotal.text = m_nTilesTotal.toString();
			}			
*/
		}
        private function createTextField(x:Number, y:Number, width:Number, height:Number):TextField {
			var format: TextFormat = new TextFormat();
			
			format.color = 0x666666;
			format.size = 20;
			format.bold = true;
			format.font = 'System';

            var result:TextField = new TextField();
            result.x = x;
            result.y = y;
            result.width = width;
            result.height = height;
            result.background = false;
            result.border = false;
            result.type = TextFieldType.DYNAMIC;
			result.textColor = 0xcecece;
			result.autoSize = "left";
			result.defaultTextFormat = format; 
            addChild(result);
            return result;
        }			
		private function enterFrameHandler( event:Event ):void
		{
			ballPhysics( );
			
			ballMarker.markerZ().z = ( ball.z );
			ballMarker.markerZ().y = -20;//( ball.y );
			ballMarker.markerX().x = ( ball.x );

			bat.x = batVector.x;
			bat.z = batVector.z;
			
//			world.camera.target = new Vector( ball.getPosition().x, 0, 0);
			world.render();
		}
		public function ballReset():void {
			isBallReset = false;
			m_nMultiplier = 1;
            tfMultiplier.text = "x" + m_nMultiplier.toString();
			tfLevel.text = "level " + m_nGameLevel;
			tfInstructions.text = " ";
			
			if (enableRestart) {			
				m_nScore = 0;
				tfScore.text = "score: " + m_nScore.toString() + "";
				m_nLives = 5;
				tfLives.text = "lives: " + m_nLives.toString() + "";
				makeLevel(1);
				enableRestart = false;
			}
			
		}
		private function ballPhysics( ):void {
			if (!isBallReset) {									// check for ball on bat 
				isBallOverX =  ( ( ball.x > ( bat.x - bat.dim().x/2 ) ) && ( ball.x < ( bat.x + bat.dim().x/2 ) ) );
				isBallOverZ =  ( ( ball.z > ( bat.z - bat.dim().z/2 ) ) && ( ball.z < ( bat.z + bat.dim().z/2 ) ) );
				
				if ( isBallOverX && isBallOverZ ) {				// ball is over bat indicator
					bat.appearance = lineOverMaterial;
					bat.appearance = lineOverMaterial;
					ballMarker.markerX().appearance = lineOverMaterial;
					ballMarker.markerZ().appearance = lineOverMaterial;
					ball.appearance = lineOverMaterial;
				} else {
					bat.appearance = lineOutMaterial;
					bat.appearance = lineOutMaterial;
					ballMarker.markerX().appearance = lineOutMaterial;
					ballMarker.markerZ().appearance = lineOutMaterial;
					ball.appearance = lineOutMaterial;
				}
				if ( ball.x > 14 ) {						// ball out of horizontal bounds
					ballVector.x *=-1;
					ball.x = 14;
					room.doCollide( 3, ball.getPosition() );
				} else if ( ball.x < -14 ) {
					ballVector.x *=-1;
					ball.x = -14;
					room.doCollide( 1, ball.getPosition() );
				}						
				if ( ball.z > 14 ) { 
					room.doCollide( 5, ball.getPosition() );
					ballVector.z *=-1;
					ball.z = 14;
				} else if ( ball.z < -14 ) { 
					room.doCollide( 6, ball.getPosition() );
					ballVector.z *=-1;
					ball.z = -14;
				} 

				if ( ball.y > 20 ) { 							// ball above vertical bounds
					ballVector.y *=-1;
					room.doCollide( 4, ball.getPosition() );
				} else if ( ball.y < -18 ) {
					if ( isBallOverX ) {
						if ( isBallOverZ ) {					// ball collide with bat
							ballVector.y *=-1;
							var l_nDirection:Number = bat.x - ball.x;
							batHitSound.play();
							
							ballVector.x = l_nDirection/m_nFriction;
							ballVector.z = (bat.z - ball.z)/m_nFriction;
							var ry : Number = bat.rotateY;
							var dy : Number = ((l_nDirection!=0)?((Math.abs(l_nDirection)/l_nDirection)*90):0);
							Tweener.addTween( bat, { rotateY:ry+dy, time : 1, transition : "easeOutExpo",
								onComplete : function():void {  } });
							var py : Number = bat.y;
							Tweener.addTween( bat, { y:py-0.5, time : 0.1, transition : "easeOutExpo",
								onComplete : function():void {
									Tweener.addTween( bat, { y:py, time : 0.5, transition : "easeOutElastic",
										onComplete : function():void {  } 
									})
							} });
			            tfMultiplier.text = "x" + m_nMultiplier.toString();
							
						} 
					} 
					if (!(isBallOverX&&isBallOverZ)) {			// ball under vertical bounds
						ballVector.x = ballVector.z = 0;
						ball.y=0;
						ball.x = bat.x;
						ball.z = bat.z;
						isBallReset = true;
						bat.appearance = lineOverMaterial;
						bat.appearance = lineOverMaterial;
						m_nLives--;
						tfLives.text = "lives: " + m_nLives.toString() + "";
						 
						if (m_nLives==0) {
							tfInstructions.text = "game over"; 
							enableRestart = true;
							m_nGameLevel = 1;
							var oHitSound : SoundGameOver = new SoundGameOver();
							oHitSound.play();
						} else {
							tfInstructions.text = "click to continue";
						}
						room.doCollide(2, ball.getPosition());
					} 
				} else for ( var i:Number=0; i< tileLevels.length; i++ ) {				
					var spacerHack : Number = 1.5;
					if ( ( ball.y > (tileLevels[i]-spacerHack/2) ) && ( ball.y < (tileLevels[i]+spacerHack/2) ) ) { //HACK for ball height
						if ( tileSpace.isCollision( ball, i ) ) {			// ball collide with tile
							tileHitSound.play();
							m_nScore += ( m_nMultiplier++ * tileSpace.doCollide( ballVector ) );
				            tfMultiplier.text = "x" + m_nMultiplier.toString();
							tfScore.text = "score: " + m_nScore.toString() + "";
							m_nTilesRemain--;
							if (m_nTilesRemain==0){ 						//  level success
								makeLevel(++m_nGameLevel);
								tfLevel.text = "level " + m_nGameLevel;
								var pHitSound : SoundLevelPass = new SoundLevelPass();
								pHitSound.play();
							} 
							tfTilesRemain.text = "tiles: " + Math.round( (m_nTilesTotal-m_nTilesRemain)/m_nTilesTotal * 100) + "% ("+ ((m_nTilesTotal-m_nTilesRemain).toString()) + "/" + m_nTilesTotal.toString() + ")";
						}
					}
				}
				
				ball.x += ballVector.x;							// move the ball according to it's vector	
				ball.y += ballVector.y;
				ball.z += ballVector.z;
			} else {											// move the ball with the bat
				ball.x = bat.x;								
				ball.z = bat.z;
			}				
			
		} 
	}
}
