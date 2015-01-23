
/* GAME */

var game = function ( options ) {

    // FUNCTIONS

    var init = function () {

        init_board ();

        $board.attr ( 'class', 'sizex-' + options.size.x + ' sizey-' + options.size.y );

        $board_content.html ( '' );

        add_placeholders ();

        add_blocks ( options.blocks.how_many.at_start );

        $score_nr.html ( score );

        best_score = cookie.read ( options.score.best_cookie_name ) || 0;

        $best_nr.html ( best_score );

        status = 'playing';

        var can_move = check_can_move ();

        if ( can_move ) {

            listening = true;

        } else {

            console.log ( 'LOST!' );

        }

        if ( options.debug ) {

            print_board ();

        }

    };

    var init_board = function () {

        for ( var n = 0; n < options.size.x * options.size.y; n++ ) {

            board[n] = {
                value: false,
                merged: false
            };

        }

    };

    var add_placeholders = function () {

        var placeholders_html = '';

        for ( var n = 0; n < options.size.x * options.size.y; n++ ) {

            placeholders_html += get_placeholder_html ();

        }

        $board_content.append ( placeholders_html );

    };

    var get_placeholder_html = function () {

        return '<div class="placeholder"></div>';

    };

    var add_block = function () {

        var index = get_random_empty_index (),
            value = get_new_block_value ();

        if ( index === false ) return false;

        board[index].value = value;

        var block_html = get_block_html ( index, value );

        $board_content.append ( block_html );

        var $block = $board_content.find ( '.index-' + index );

        positionate_block ( $block, index );

        $.defer ( function () {

            $block.removeClass ( 'unpop' );

        });

        return true;

    };

    var add_blocks = function ( nr ) {

        var added = [];

        for ( var n = 0; n < nr; n++ ) {

            added.push ( add_block () );

        }

        for ( var n = 0; n < added.length; n++ ) {

            if ( added[n] === false ) {

                return false;

            }

        }

        return true;

    };

    var get_block_html = function ( index, value ) {

        return '<div class="block unpop index-' + index + ' value-' + value + '" data-value="' + value + '"></div>';

    };

    var positionate_block = function ( $block, index ) {

        $block.css ({
            top: Math.floor ( index / options.size.x ) * ( 100 / options.size.y ) + '%',
            left: ( index % options.size.x ) * ( 100 / options.size.x ) + '%'
        })

    };

    var get_random_empty_index = function () {

        var all_empty = [];

        for ( var n = 0; n < options.size.x * options.size.y; n++ ) {

            if ( board[n].value === false ) {

                all_empty.push ( n );

            }

        }

        return ( all_empty.length > 0 ) ? all_empty[ Math.floor ( Math.random () * all_empty.length ) ] : false;

    };

    var get_new_block_value = function () {

        var percentage = Math.random () * 100;

        for ( var power in options.blocks.powers_probability ) {

            if ( percentage !== 0 && percentage <= options.blocks.powers_probability[power] ) {

                return Math.pow ( options.blocks.base, power );

            }

        }

        return options.blocks.base;

    };

    var move_blocks = function ( offset, axis ) {

        var reversed = false;
            merged = false,
            moved = false,
            new_score = 0;

        // REVERSE - Part 1

        if ( offset > 0 ) {

            reversed = true;

            offset = -offset;

            board = board.reverse ();

        }

        // MERGE

        for ( var n = 0; n < options.size.x * options.size.y; n++ ) {

            var current = board[n];

            if ( current.value === false ) continue;

            for ( var n2 = 1; n2 < ( ( axis === 'x' ) ? options.size.x : options.size.y ); n2++ ) {

                var new_offset = n + ( offset * n2 );

                if ( new_offset < 0 ) break;

                var offsetted = board[new_offset];

                if ( ( axis === 'x' && Math.floor ( n / options.size.x ) !== Math.floor ( new_offset / options.size.x ) ) || ( axis === 'y' && n % options.size.x !== new_offset % options.size.x ) ) break; // Different axis

                if ( offsetted.value === current.value && offsetted.merged === false ) {

                    board[new_offset].value *= 2;
                    board[new_offset].merged = true;

                    new_score += board[new_offset].value;

                    board[n].value = false;

                    var $start_block = $board_content.find ( '.block.index-' + ( reversed ? options.size.x * options.size.y - 1 - n : n ) );
                    var $end_block = $board_content.find ( '.block.index-' + ( reversed ? options.size.x * options.size.y - 1 - new_offset : new_offset ) );

                    $end_block.attr ( 'class', 'block index-' + ( reversed ? options.size.x * options.size.y - 1 - new_offset : new_offset ) + ' value-' + board[new_offset].value );
                    $end_block.data ( 'value', board[new_offset].value );

                    $end_block.addClass ( 'pop' );

                    setTimeout ( function ( $end_block ) {

                        $end_block.removeClass ( 'pop' );

                    }, options.animations.duration / 2, $end_block );

                    if ( options.debug ) {

                        console.log ( '- merging...' );
                        console.log ( 'offset: ' + offset );
                        console.log ( 'current: ' + current.value );
                        console.log ( 'offsetted: ' + offsetted.value );
                        console.log ( $start_block.toArray () );
                        console.log ( $end_block.toArray () );

                    }

                    positionate_block ( $start_block, ( reversed ? options.size.x * options.size.y - 1 - new_offset : new_offset ) );

                    $start_block.addClass ( 'unpop' );

                    setTimeout ( function ( $start_block ) {

                        $start_block.remove ();

                    }, options.animations.duration, $start_block );

                    merged = true;

                    break;

                } else if ( offsetted.value !== false ) {

                    break;

                }

            }

        }

        // MOVING

        for ( var n = 0; n < options.size.x * options.size.y; n++ ) {

            var current = board[n],
                last_empty_offset = false;

            if ( current.value === false ) continue;

            for ( var n2 = 1; n2 < ( ( axis === 'x' ) ? options.size.x : options.size.y ); n2++ ) {

                var new_offset = n + ( offset * n2 );

                if ( new_offset < 0 ) break;

                var offsetted = board[new_offset];

                if ( ( axis === 'x' && Math.floor ( n / options.size.x ) !== Math.floor ( new_offset / options.size.x ) ) || ( axis === 'y' && n % options.size.x !== new_offset % options.size.x ) ) break; // Different row and column

                if ( offsetted.value === false ) {

                    if ( options.debug ) {

                        console.log ( 'empty: ' + ( reversed ? options.size.x * options.size.y - 1 - new_offset : new_offset ) );

                    }

                    last_empty_offset = new_offset;

                } else {

                    break;

                }

            }

            if ( last_empty_offset !== false ) {

                board[last_empty_offset].value = board[n].value;
                board[n].value = false;

                var $start_block = $board_content.find ( '.block.index-' + ( reversed ? options.size.x * options.size.y - 1 - n : n ) );

                $start_block.attr ( 'class', 'block index-' + ( reversed ? options.size.x * options.size.y - 1 - last_empty_offset : last_empty_offset ) + ' value-' + board[last_empty_offset].value + ' ' + ( $start_block.hasClass ( 'pop' ) ? 'pop' : '' ) );

                if ( options.debug ) {

                    console.log ( '- moving...' );
                    console.log ( 'offset: ' + offset );
                    console.log ( 'starting index: ' + ( reversed ? options.size.x * options.size.y - 1 - n : n ) );
                    console.log ( 'ending index: ' + ( reversed ? options.size.x * options.size.y - 1 - last_empty_offset : last_empty_offset ) );
                    console.log ( $start_block.toArray () );

                }

                positionate_block ( $start_block, ( reversed ? options.size.x * options.size.y - 1 - last_empty_offset : last_empty_offset ) );

                moved = true;

            }

        }

        // CLEANING

        if ( merged ) {

            for ( var n = 0; n < options.size.x * options.size.y; n++ ) {

                board[n].merged = false;

            }

        }

        // REVERSE - Part 2

        if ( reversed ) {

            board = board.reverse ();

        }

        // SCORE

        if ( new_score > 0 ) {

            score += new_score;

            $score_nr.html ( score );

            $score.append ( get_score_notified_html ( new_score ) );

            var $notified = $score.find ( '.notified' ).last ();

            $.defer ( function () {

                $notified.addClass ( 'show' );

                $.defer ( function () {

                    $notified.addClass ( 'hide' );

                    setTimeout ( function () {

                        $notified.remove ();

                    }, options.animations.duration );

                }, options.animations.duration / 3 );

            });

            if ( score > best_score ) {

                best_score = score;

                cookie.write ( options.score.best_cookie_name, best_score );

                $best_nr.html ( score );

                $best.addClass ( 'highlight' );

            }

        }

        // RETURNING

        return merged || moved;

    };

    var get_score_notified_html = function ( score ) {

        return '<div class="notified">' + ( ( score >= 0 ) ? '+' : '-' ) + score + '</div>';

    };

    var check_can_move = function () { //FIXME: It doesn't work, check the screenshot for more infos

        // CHECK EMPTY

        for ( var n = 0; n < options.size.x * options.size.y; n++ ) {

            if ( board[n].value === false ) {

                return true;

            }

        }

        // CHECK MERGING

        var offsets = [{
            value: 1,
            axis: 'x'
        }, {
            value: options.size.x,
            axis: 'y'
        }, {
            value: - 1,
            axis: 'x'
        }, {
            value: - options.size.x,
            axis: 'y'
        }];

        for ( var n = 0; n < options.size.x * options.size.y; n++ ) {

            for ( var on = 0; on < offsets.length; on++ ) {

                var offset = offsets[on].value,
                    axis = offsets[on].axis,
                    new_offset = n + offset;

                if ( new_offset < 0 || new_offset >= options.size.x * options.size.y ) break;

                var offsetted = board[new_offset];

                if ( ( axis === 'x' && Math.floor ( n / options.size.x ) !== Math.floor ( new_offset / options.size.x ) ) || ( axis === 'y' && n % options.size.x !== new_offset % options.size.x ) ) break; // Different row and column

                if ( offsetted.value === board[n].value ) {

                    return true;

                }

            }

        }

        return false;

    };

    var print_board = function () {

        var board_string = '';

        for ( var n = 0; n < options.size.x * options.size.y; n++ ) {

            if ( n % options.size.x === 0 ) {

                board_string += '\n';

            }

            board_string += ( board[n].value || '-' ) + ' ';

        }

        board_string += '\n';

        console.log ( board_string );

    };

    // VARIABLES

    var status = 'initing',
        listening = false,
        board = [],
        score = options.score.start,
        best_score = 0,
        $board = $('#board'),
        $board_content = $board.find ( '.content' ),
        $score = $('.infobox.score .content'),
        $score_nr = $score.find ( '.nr' ),
        $best = $('.infobox.best .content'),
        $best_nr = $best.find ( '.nr' );

    // INIT

    init ();

    // EVENTS

    // Keyboard

    $window.on ( 'keydown', function ( event ) {

        if ( listening === false ) return;

        if ( event.keyCode < 37 || event.keyCode > 40 ) return;

        listening = false;

        var added,
            moved;

        switch ( event.keyCode ) {

            case 37: // LEFT
                moved = move_blocks ( - 1, 'x' );
                break;

            case 38: // UP
                moved = move_blocks ( - options.size.x, 'y' );
                break;

            case 39: // RIGHT
                moved = move_blocks ( 1, 'x' );
                break;

            case 40: // DOWN
                moved = move_blocks ( options.size.x, 'y' );
                break;

        }

        if ( moved ) {

            if ( options.debug ) {

                print_board ();

            }

            added = add_blocks ( options.blocks.how_many.after_turn );

            if ( options.debug ) {

                print_board ();

            }

        }

        var can_move = check_can_move ();

        if ( can_move ) {

            listening = true;

        } else {

            console.log ( 'LOST!' );

        }

    });

    // Touch

    //TODO: Add touch support

};

/* OPTIONS */

var options = {
    init: function () {
        options.animations.duration = options.animations.enabled ? options.animations.duration : 0;
        options.score.goal = Math.pow ( options.blocks.base, options.score.goal_power );
    },
    debug: true,
    animations: {
        enabled: true,
        duration: 250 // linked to the respective CSS value
    },
    size: {
        x: 4,
        y: 4
    },
    blocks: {
        how_many: {
            at_start: 2,
            after_turn: 1
        },
        base: 2,
        powers_probability: { // It must be sorbed descending by probability - power: probability (percentage) //FIXME: this won't work
            2: 10,
            3: 1,
            4: 0.1
        }
    },
    score: {
        start: 0,
        goal_power: 11,
        goal: 0, // Generated by the init function
        best_cookie_name: 'best'
    }
};

options.init ();

/* READY */

$.dom_ready ( function () {

    game ( options );

});
