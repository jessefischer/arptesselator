$(function(){

	var AppModel = Backbone.Model.extend({

			defaults: {
				key: 0,
				scale: 0,
				gridWidth: 5,
				gridHeight: 5,
				playState: 'init',
				tempo: 120,
				pattern: [ null, null, null, null, null ]
			},

			setPatternElement: function( i, n ) {
				var newPattern = _.clone( this.get( 'pattern' ) );
				newPattern[i] = n;
				this.set( 'pattern', newPattern );
			}
		},
		{
			Keys: [ "C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B" ],
			Scales: [ "Pentatonic", "Major", "Minor", "Dorian", "Mixolydian", "Whole-tone", "Half-tone Whole-tone", "Whole-tone Half-tone", "Chromatic" ],
			ScaleElements: {
				"Pentatonic" : [0, 2, 4, 7, 9],
				"Major"      : [0, 2, 4, 5, 7, 9, 11],
				"Minor"      : [0, 2, 3, 5, 7, 8, 10],
				"Dorian"     : [0, 2, 3, 5, 7, 9, 10],
				"Mixolydian" : [0, 2, 4, 5, 7, 9, 10],
				"Whole-tone" : [0, 2, 4, 6, 8, 10],
				"Half-tone Whole-tone" : [0, 1, 3, 4, 6, 7, 9, 10],
				"Whole-tone Half-tone" : [0, 2, 3, 5, 6, 8, 9, 11],
				"Chromatic"  : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
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
			'change .gridElement' : 'gridElementSelect',
			'click #playButton' : 'play',
			'change input#tempo' : 'updateTempo'
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

			// Populate step select menu
			for (var i = 0; i < this.model.get( 'gridHeight' ); i++) {
				this.$('#stepSelect').append( "<option value='" + i + "'>" + i + "</option>" );
			}

			// Populate patternGrid
			for (var i = 0; i < this.model.get( 'gridWidth' ); i++) {
				var tempHTML = "<div id='col-" + i + "' class='patternCol'>";
				for (var j = this.model.get( 'gridHeight' ) - 1; j >= 0; j--) {
					tempHTML += "<input type='checkbox' class='gridElement col-" + i + "' id='" + i + "-" + j + "''>";
				}
				tempHTML += "</div>";
				this.$('#patternGrid').append( tempHTML );
			}

			this.model.on( 'change:pattern', this.reRender, this);


		},

		reRender: function() {
			for (var i = 0; i < this.model.get( 'gridWidth' ); i++) {
				for (var j = this.model.get( 'gridHeight' ) - 1; j >=0; j--) {
					var patternElement = this.model.get( 'pattern' )[i];
					if ( patternElement && patternElement == j ) {
						$("#" + i + "-" + j).prop( 'checked', true );
					}
					else
					{
						$("#" + i + "-" + j).prop( 'checked', false );
					}

				}
			}
		},

		keySelect: function() {
			this.model.set( "key", this.$( "#keySelect" ).val());
			console.log( JSON.stringify( this.model ));
			this.render();
		},

		scaleSelect: function() {
			this.model.set( "scale", this.$( "#scaleSelect" ).val());
			this.render();
		},

		updateTempo: function() {
			this.model.set( 'tempo', this.$( "input#tempo" ).val());
			Tone.Transport.bpm.value = this.model.get( 'tempo' );
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
			// update Tone.JS pattern
		},

		render: function() {
			/* var tempHTML = "";
			var key = this.model.get( 'key' );
			AppModel.ScaleElements[ AppModel.Scales[ this.model.get('scale') ] ].forEach( function( scaleElement ) {
				tempHTML += parseInt( AppModel.MiddleC ) + parseInt( key ) + parseInt( scaleElement ) + " ";
			});
			this.$( "#mainText" ).html( tempHTML );*/

		},


		play: function() {
			console.log( "Play", JSON.stringify( this.model.get( 'pattern' )));

			switch ( this.model.get( 'playState' ) ) {
				case 'init':
					this.model.set( 'playState', 'playing' );
					$( '#playButton' ).text( "Stop" );

					// Initialize Tone.js
					this.synth = new Tone.Synth().toMaster();
					Tone.Transport.bpm.value = this.model.get( 'tempo' );
					var theSynth = this.synth;
					var theModel = this.model;

					// Iterate over pattern ----- refactor to AppModel method!!
					var i = 0;
					this.loop = new Tone.Loop( function( time ) {
						if ( theModel.get( 'pattern' )[i] != null ) {
							var MIDINote = parseInt( AppModel.MiddleC ) + parseInt( theModel.get( 'key' ) ) +
								AppModel.ScaleElements[ AppModel.Scales[ theModel.get( 'scale' ) ] ][ theModel.get( 'pattern' )[i] ];
							theSynth.triggerAttackRelease(
								Tone.Frequency( MIDINote, 'midi'),
								'16n', time, 1 - Math.pow( Math.random(), 4 )
							);
						}
						if ( i < theModel.get( 'gridWidth' ) - 1 ) {
							i++;
						}
						else {
							i = 0;
						}
					}, '8n' ).start( 0 );

					Tone.Transport.start();
					break;
				case 'stopped':
					this.model.set( 'playState', 'playing' );
					$( '#playButton' ).text( "Stop" );
					Tone.Transport.start();
					break;
				case 'playing':
					this.model.set( 'playState', 'stopped' );
					$( '#playButton' ).text( "Play" );
					Tone.Transport.stop();
					break;
				default:
					console.log( "Error: playState in unexpected state '" + this.model.get( 'playState' ) + "'" );
			}


		}

	});

	var appView = new AppView;



});