$(function(){

	var AppModel = Backbone.Model.extend({

			defaults: {
				key: 0,
				scale: 0,
				steps: 5,
				mungeFreq: 0,
				currentStep: 0,
				playState: 'init',
				tempo: 120,
				pattern: [ 0, 1, 2, null, 3 ]
			},

			getPatternElement: function( i ) {
				return this.get( 'pattern' )[i];
			},

			setPatternElement: function( i, n ) {
				var newPattern = _.clone( this.get( 'pattern' ) );
				newPattern[i] = n;
				this.set( 'pattern', newPattern );
			},

			getScaleLength: function() {
				return AppModel.ScaleElements[ AppModel.Scales[ this.get( 'scale' ) ] ].length;
			}
		},
		{
			Keys: [ "C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B" ],
			Scales: [ "Pentatonic", "Minor Pentatonic", "Major", "Minor", "Dorian", "Mixolydian", "Phreygish", "Misheberakh", "Whole-tone", "Half-tone Whole-tone", "Whole-tone Half-tone", "Chromatic" ],
			ScaleElements: {
				"Pentatonic" 		   : [0, 2, 4, 7, 9],
				"Minor Pentatonic"     : [0, 2, 3, 7, 9],
				"Major"				   : [0, 2, 4, 5, 7, 9, 11],
				"Minor"				   : [0, 2, 3, 5, 7, 8, 10],
				"Dorian"               : [0, 2, 3, 5, 7, 9, 10],
				"Mixolydian"           : [0, 2, 4, 5, 7, 9, 10],
				"Phreygish"			   : [0, 1, 4, 5, 7, 8, 10],
				"Misheberakh"          : [0, 2, 3, 6, 7, 9, 10],
				"Whole-tone"           : [0, 2, 4, 6, 8, 10],
				"Half-tone Whole-tone" : [0, 1, 3, 4, 6, 7, 9, 10],
				"Whole-tone Half-tone" : [0, 2, 3, 5, 6, 8, 9, 11],
				"Chromatic"            : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
			},
			MiddleC : 60
		}
	);

	var AppView = Backbone.View.extend({

		el: $("#app"),

		model: new AppModel,

		events: {
			'change #keySelect' : 'keySelect',
			'change #scaleSelect' : 'scaleSelect',
			'change #mungeFreqSelect' : 'mungeFreqSelect',
			'change input#tempo' : 'updateTempo',
			'change input#steps' : 'updateSteps',
			'change .gridElement' : 'gridElementSelect',
			'click #playPauseButton' : 'playPause',
			'mousedown div.gridCell' : 'cellClick',
			'mouseover div.gridCell' : 'cellMouseEnter'
		},

		initialize: function() {
			// Populate keys select menu
			AppModel.Keys.forEach( function( keyName, keyIndex) {
				this.$( '#keySelect' ).append( "<option value='" + keyIndex + "'>" + keyName + "</option>" );
			});

			// Populate scales select menu
			AppModel.Scales.forEach( function( scaleName, scaleIndex) {
				this.$( '#scaleSelect' ).append( "<option value='" + scaleIndex + "'>" + scaleName + "</option>" );
			});

			this.$( '#tempo' ).val( Tone.Transport.bpm.value = this.model.get( 'tempo' ) );
			this.$( '#steps' ).val( this.model.get( 'steps' ));

			this.model.on( 'change:pattern', this.render, this);
			// this.listenTo( this.model, 'change:pattern', this.render); --- update this??

			// Catch keypresses when no focus
			_.bindAll( this, 'playPauseOnSpace' );
			$( document ).bind( 'keypress', this.playPauseOnSpace );

			this.render();
		},

		// Render pattern grid
		render: function() {
			this.$( '#patternGrid' ).empty();
			for ( var i = 0; i < this.model.get( 'steps' ); i++ ) {
				var tempHTML = "<div id='col-" + i + "' class='patternCol'>";
				for ( var j = this.model.getScaleLength() - 1; j >= 0; j-- ) {
					tempHTML += "<div class='gridCell" +
						( this.model.get( 'pattern' )[i] == j ? " active'" : "'" ) +
						"' id='cell-" + i + "-" + j + "'>" +
						"<input type='checkbox' class='gridElement col-" + i + "' id='" + i + "-" + j + "'" + 
						( this.model.get( 'pattern' )[i] == j ? " checked>" : ">" ) + "</div>";
				}
				tempHTML += "</div>";
				this.$( '#patternGrid' ).append( tempHTML );
			}
		},

		keySelect: function() {
			this.model.set( "key", this.$( "#keySelect" ).val());
			this.$( "#keySelect" ).blur();
			this.render();
		},

		scaleSelect: function() {
			this.model.set( "scale", this.$( "#scaleSelect" ).val());
			for ( var i = 0; i < this.model.get( 'pattern' ).length; i++ ) {
				if ( this.model.get( 'pattern' )[i] >= this.model.getScaleLength() ) {
					this.model.setPatternElement( i, null );
				}
			}
			this.$( "#scaleSelect" ).blur();

			this.render();
		},

		mungeFreqSelect: function() {
			this.model.set( "mungeFreq", this.$( "#mungeFreqSelect" ).val());
			this.$( "#mungeFreqSelect" ).blur();
			this.render();
		},


		updateTempo: function() {
			this.model.set( 'tempo', this.$( "input#tempo" ).val());
			this.$( "input#tempo" ).blur();
			Tone.Transport.bpm.value = this.model.get( 'tempo' );
			this.render();
		},

		updateSteps: function() {
			var newSteps = this.$( '#steps' ).val(),
				currentSteps = this.model.get( 'steps' ),
				newPattern = this.model.get( 'pattern' );

			this.$( "input#steps" ).blur();


			console.log( "newSteps: " + newSteps );
			console.log( "currentSteps: " + currentSteps );
			console.log( "newPattern:" + newPattern );

			newPattern.length = newSteps;
			if ( newSteps > currentSteps ) {
				newPattern.fill( null, currentSteps )
			}

			this.model.set( 'pattern', newPattern );
			this.model.set( 'steps', newSteps )
			this.render();
		},

		gridElementSelect: function( e ) {
			var [x, y] = e.target.id.split( '-' );
			if ( e.target.checked ) {
				this.model.setPatternElement( x, y );
			}
			else
			{
				this.model.setPatternElement( x, null );
			}
		},

		cellMouseEnter: function( e ) {
			if ( e.buttons > 0 && (this.model.get( 'activeClickTarget' ).id != e.target.id )) {
				this.cellClick( e );
			}
		},

		cellClick: function( e ) {
			this.model.set( 'activeClickTarget', e.target );
			var i, j;
			[i, j] = e.target.id.split( '-' ).splice( 1 );
			if ( this.model.get( 'pattern' )[i] != j ) {
				this.model.setPatternElement( i, parseInt( j ) );
			}
			else {
				this.model.setPatternElement( i, null );
			}
			console.log( this.model.get( 'pattern' ));
			this.render();
		},

		playPauseOnSpace: function( e ) {
			// fix this when focus is on play/pause button
			// fix this when focus is nowhere on the app
			switch ( e.keyCode ) {
				// Spacebar
				case 32:
					this.playPause();
					e.preventDefault();
					break;
				// Return
				/*case 13:
					this.playFromStart();
					e.preventDefault();
					break;*/
			}
		},

		playFromStart() {
			this.model.set( 'currentStep', 0 );
		},

		playPause: function() {
			this.$( "#playPauseButton" ).blur();

			switch ( this.model.get( 'playState' ) ) {
				case 'init':
					this.model.set( 'playState', 'playing' );
					$( '#playPauseButton' ).text( "Pause" );

					// Initialize Tone.js
					this.synth = new Tone.Synth().toDestination();
					this.loop = new Tone.Loop( _.bind( this.playNextStep, this ), '8n' ).start( 0 );
					Tone.Transport.start();
					break;
				case 'stopped':
					this.model.set( 'playState', 'playing' );
					$( '#playPauseButton' ).text( "Pause" );
					Tone.Transport.start();
					break;
				case 'playing':
					this.model.set( 'playState', 'stopped' );
					$( '#playPauseButton' ).text( "Play" );
					Tone.Transport.stop();
					break;
				default:
					console.log( "Error: playState in unexpected state '" + this.model.get( 'playState' ) + "'" );
			}


		},

		playNextStep: function( time ) {
			if ( this.model.get( 'pattern' )[ this.model.get( 'currentStep' ) ] != null ) {
				var MIDINote = parseInt( AppModel.MiddleC ) + parseInt( this.model.get( 'key' ) ) +
					AppModel.ScaleElements[ AppModel.Scales[ this.model.get( 'scale' ) ] ][ this.model.get( 'pattern' )[ this.model.get( 'currentStep' ) ] ];
				this.synth.triggerAttackRelease(
					Tone.Frequency( MIDINote, 'midi'),
					'16n', time
				);
			}
			var $el = this.$( "div#cell-" + this.model.get( 'currentStep' ) +
				"-" + this.model.get( 'pattern' )[ this.model.get( 'currentStep' )]);

			$el.toggleClass( 'playing' );
			setTimeout( function() { $el.toggleClass( 'playing' ); }, 100 );

			this.mungePattern();
			this.nextStep();
		},

		nextStep: function() {
			this.model.set( 'currentStep', (this.model.get( 'currentStep' ) + 1) % this.model.get( 'steps' ), )
		},

		mungePattern: function() {
			var mungeFreq = this.model.get( 'mungeFreq' );
			console.log( "mungeFreq: ", mungeFreq );
			var mungeWeight = 1;
			for ( var i=0; i < this.model.get( 'pattern' ).length; i++ ) {
				var rand = Math.random();
				if ( rand <= mungeFreq ) {
					if ( this.model.get( 'pattern' )[i] == null )
					{
						this.model.setPatternElement( i, Math.floor( Math.random() * this.model.getScaleLength() ) );
						this.render();
					}
					else {
						
						var r = Math.random();
						var delta = Math.round( Math.pow( (r * 2) - 1, 5 ) * (this.model.getScaleLength()/2) );

						if ( delta != 0 ) {
							this.model.setPatternElement( i, (this.model.get( 'pattern' )[i] + delta + this.model.getScaleLength()) % this.model.getScaleLength());
						}
						this.render();

					}
					/*if ( delta == this.model.getScaleLength() ) {
						this.model.setPatternElement( i, null );
					} else {
						if ( this.model.get( 'pattern' )[i] == null ) {
							this.model.setPatternElement( i, 0 );
						}
						this.model.setPatternElement( i, (this.model.get( 'pattern' )[i] + delta) % this.model.getScaleLength() );
					}
					*/
				}
			}
		}

	});

	var appView = new AppView;



});