
/* lQuery */

var lQuery;

(function() {

    /* VARIABLES */

    var _matches_fn = ( document.documentElement.matches || document.documentElement.matchesSelector || document.documentElement.webkitMatchesSelector || document.documentElement.mozMatchesSelector || document.documentElement.msMatchesSelector || document.documentElement.oMatchesSelector );

    var rootNodeRE = /^(?:body|html)$/i;
    var readyRE = /complete|loaded|interactive/;
    var simpleSelectorRE = /^[\w-]*$/;

    /* EXTERNAL UTILITES */

    var camelize = function ( str ) {

        var camel_cased = str.replace ( /-+(.)?/g, function ( match, chr ) { return chr ? chr.toUpperCase () : '' } );

        return camel_cased[0].toLowerCase () + camel_cased.slice ( 1 );

    };

    var deserialize_value = function ( value ) {

        var num;

        return value
                   ? value == "true" ||
                       ( value == "false"
                             ? false
                             : value == "null"
                                 ? null
                                 : !/^0/.test ( value ) && !isNaN ( num = Number ( value ) )
                                     ? num
                                     : /^[\[\{]/.test ( value )
                                         ? JSON.parse ( value )
                                         : value )
                   : value;

    };

    var nl2arr = function ( node_list ) {

        return Array.prototype.slice.call ( node_list );

    };

    var DOMPositionComparator = function ( a, b ) {

        return 3 - ( a.compareDocumentPosition ( b ) & 6 );

    };

    var arr_unique =  function ( arr, sorted ) {

        var sorted = sorted ? arr : ( arr[0].compareDocumentPosition ? arr.sort ( DOMPositionComparator ) : arr.sort () ),
            prev;

        for ( var i = sorted.length - 1; i >= 0; i-- ) {

            if ( sorted[i] === prev ) sorted.splice ( i, 1 );
            else prev = sorted[i];

        };

        return sorted;

    };

    var is_loopable = function ( obj ) {

        return ( obj instanceof NodeList || obj instanceof Array || obj instanceof HTMLCollection );

    };

    var dom_selector = function ( parent, selector ) { // returns an array of dom elements

        var found,
            maybe_id = ( selector[0] === '#' ),
            maybe_class = ( !maybe_id && selector[0] === '.' ),
            name_only = ( ( maybe_id || maybe_class ) ? selector.slice ( 1 ) : selector ),
            is_simple = simpleSelectorRE.test ( name_only );

        return is_simple
                    ? maybe_id
                        ? ( found = parent.getElementById ( name_only ) )
                            ? [found]
                            : []
                        : maybe_class
                            ? nl2arr ( parent.getElementsByClassName ( name_only ) )
                            : nl2arr ( parent.getElementsByTagName ( selector ) )
                    : nl2arr ( parent.querySelectorAll ( selector ) );

    };

    /* MAIN */

    lQuery = function ( selector, unique ) {

        return new Library ( selector, unique );

    };

    var Library = function ( selector, unique ) {

        this.nodes = !selector
                        ? []
                        : typeof selector === 'string'
                            ? dom_selector ( document, selector )
                            : is_loopable ( selector )
                                ? unique
                                    ? selector
                                    : arr_unique ( selector )
                                : selector instanceof Library
                                    ? selector.nodes
                                    : typeof selector === 'object'
                                        ? [selector]
                                        : [];

        this.length = this.nodes.length;

        return this;

    };

    /* UTILITIES */

    lQuery.dom_ready = function ( callback ) {

        // need to check if document.body exists for IE as that browser reports
        // document ready when it hasn't yet created the body element

        if ( readyRE.test ( document.readyState ) && document.body ) callback ();
        else lQuery(document).on ( 'DOMContentLoaded', callback );

    };

    lQuery.defer = function ( callback, ms ) {

        $html.get ( 0 ).clientHeight; // necessary, so that the deferred callback will be executed in another cycle

        setTimeout ( callback, ms || 0 );

    };

    lQuery.ajax = function ( options ) {

        options.type = options.type ? options.type.toUpperCase () : 'GET';

        var request = new XMLHttpRequest ();
        request.open ( options.type, options.url, true );

        request.setRequestHeader ( 'X-Requested-With', 'XMLHttpRequest' );

        request.onload = function () {

            if ( request.status >= 200 && request.status < 400 ) {

                if ( options.success ) {

                    options.success ( ( options.json === true ) ? JSON.parse ( request.responseText ) : request.responseText );

                }

            } else {

                if ( options.error ) {

                    options.error ( ( options.json === true ) ? JSON.parse ( request.responseText ) : request.responseText );

                }

            }

        };

        if ( options.error ) {

            request.onerror = function () {

                options.error ( ( options.json === true ) ? JSON.parse ( request.responseText ) : request.responseText );

            };

        }

        if ( options.before ) {

            options.before ();

        }

        request.send ( options.data );

        if ( options.after ) {

            options.after ();

        }

    };

    lQuery.uuid = 0;

    lQuery.get_uuid = function () {

        return this.uuid += 1;

    };

    /* FUNCTIONS */

    lQuery.node_fn = {

        // SELECTORS

        is: function ( node, selector ) {

            if ( _matches_fn ) {

                return _matches_fn.call ( node, selector );

            } else {

                var siblings = dom_selector ( node.parentNode, selector );

                var found = false;

                for ( var i = 0; i < siblings.length; i++ ) {

                    if ( siblings[i] === node ) {

                        found = true;
                        break;

                    }

                }

                return found;

            }

        },

        // CSS

        addClass: function ( node, class_name ) {

            if ( node.classList ) node.classList.add ( class_name );
            else node.className += ' ' + class_name;

        },

        removeClass: function ( node, class_name ) {

            if ( node.classList ) node.classList.remove ( class_name );
            else node.className = node.className.replace ( new RegExp ( '(^|\\b)' + class_name + '(\\b|$)', 'gi' ), ' ' );

        },

        hasClass: function ( node, class_name ) {

            return !!( node.className && new RegExp ( '(\\s|^)' + class_name + '(\\s|$)' ).test ( node.className ) );

        },

        // INFOS

        offset: function ( node ) {

            var rect = node.getBoundingClientRect ();

            return {
                top: rect.top + document.body.scrollTop,
                left: rect.left + document.body.scrollLeft,
                width: rect.width, // should it be rounded instead???
                height: rect.height // should it be rounded instead???
            };

        }

    };

    lQuery.fn = Library.prototype = {

        // GETTING

        first: function () {

            return lQuery ( this.nodes[0] );

        },

        last: function () {

            return lQuery ( this.nodes[this.length-1] );

        },

        eq: function ( index ) {

            return lQuery ( this.get ( index ) );

        },

        get: function ( index ) {

            return this.nodes [ index >= 0 ? index : idx + this.length ];

        },

        slice: function ( start, end ) {

            return lQuery ( this.nodes.slice ( start, end || this.length ), true );

        },

        toArray: function () {

            return this.nodes;

        },

        size: function () {

            return this.length;

        },

        index: function ( ele ) {

            if ( ele instanceof Library ) ele = ele.nodes[0];

            for ( var i = 0; i < this.length; i++ ) {

                if ( this.nodes[i] == ele ) return i;

            }

            return -1;

        },

        contains: function ( ele ) {

            return ( this.index ( ele ) !== -1 );

        },

        // SELECTORS

        add: function ( ele ) {

            var new_nodes = this.nodes.concat (
                ele instanceof Library
                    ? ele.nodes
                    : ele instanceof NodeList || ele instanceof HTMLCollection
                        ? nl2arr ( ele )
                        : ele instanceof Array
                            ? ele
                            : typeof ele === 'string'
                                ? dom_selector ( document, ele )
                                : typeof ele === 'object'
                                    ? [ele]
                                    : []
            );

            return lQuery ( new_nodes );

        },

        find: function ( selector ) {

            var found = [],
                partials_nr = 0;

            for ( var i = 0; i < this.length; i++ ) {

                var partials = dom_selector ( this.nodes[i], selector );

                if ( partials.length > 0 ) {

                    found = found.concat ( partials );
                    partials_nr += 1;

                }

            }

            return lQuery ( found, partials_nr < 2 );

        },

        filter: function ( selector ) {

            var filtered = [],
                type = typeof selector;

            for ( var i = 0; i < this.length; i++ ) {

                if ( type === 'string' && lQuery.node_fn.is ( this.nodes[i], selector ) ) filtered.push ( this.nodes[i] );
                else if ( type === 'function' && selector ( this.nodes[i] ) ) filtered.push ( this.nodes[i] );

            }

            return lQuery ( filtered, true );

        },

        is: function ( selector ) {

            for ( var i = 0; i < this.length; i++ ) {

                if ( !lQuery.node_fn.is ( this.nodes[i], selector ) ) return false;

            }

            return ( this.length > 0 );

        },

        not: function ( selector ) {

            return this.filter ( function ( node ) {

                if ( selector instanceof Library ) return !selector.contains ( node );
                else return !lQuery.node_fn.is ( node, selector );

            });

        },

        parents: function ( selector, max_matches ) {

            max_matches = max_matches || 1000000;

            var all_parents = [];

            for ( var i = 0; i < this.length; i++ ) {

                var parents = [],
                    parent = this.nodes[i].parentNode;

                while ( parents.length < max_matches && parent && parent !== document ) {

                    if ( selector ) {

                        if ( lQuery.node_fn.is ( parent, selector ) ) parents.push ( parent );

                    } else {

                        parents.push ( parent );

                    }

                    parent = parent.parentNode;

                }

                all_parents = all_parents.concat ( parents );

            }

            return lQuery ( all_parents, this.length < 2 );

        },

        parent: function ( selector ) {

            return this.parents ( selector, 1 );

        },

        closest: function ( selector ) {

            return this.parent ( selector );

        },

        children: function ( selector ) {

            var children = [],
                partials_nr = 0;

            for ( var i = 0; i < this.length; i++ ) {

                var partials = [],
                    child_nodes = this.nodes[i].childNodes;

                for ( var ci = 0; ci < child_nodes.length; ci++ ) {

                    if ( child_nodes[ci].nodeType === 1 ) {

                        partials.push ( child_nodes[ci] );

                    }

                }

                if ( partials.length > 0 ) {

                    children = children.concat ( partials );
                    partials_nr += 1;

                }

            }

            return ( typeof selector === 'string' ) ? lQuery ( children, partials_nr < 2 ).filter ( selector ) : lQuery ( children, partials_nr < 2 );

        },

        // UTILITIES

        each: function ( callback ) {

            for ( var i = 0; i < this.length; i++ ) {

                if ( callback.call ( this.nodes[i], this.nodes[i], i ) === false ) break; // break if the callback returns false

            }

            return this;

        },

        map: function ( callback ) {

            var results = [];

            for ( var i = 0; i < this.length; i++ ) {

                var value = callback.call ( this.nodes[i], this.nodes[i], i );

                if ( value != null ) results.push ( value );

            }

            return results;

        },

        // ADDING / REMOVING

        insertHtml: function ( where, html ) {

            for ( var i = 0; i < this.length; i++ ) {

                this.nodes[i].insertAdjacentHTML ( where, html );

            }

            return this;

        },

        before: function ( html ) {

            return this.insertHtml ( 'beforebegin', html );

        },

        after: function ( html ) {

            return this.insertHtml ( 'afterend', html );

        },

        prepend: function ( html ) {

            return this.insertHtml ( 'afterbegin', html );

        },

        append: function ( html ) {

            return this.insertHtml ( 'beforeend', html );

        },

        remove: function () {

            for ( var i = 0; i < this.length; i++ ) {

                if ( this.nodes[i].parentNode ) this.nodes[i].parentNode.removeChild ( this.nodes[i] );

            }

            return this;

        },

        // EDIT

        attr: function ( name, value ) {

            if ( typeof value !== 'undefined' ) {

                for ( var i = 0; i < this.length; i++ ) {

                    this.nodes[i].setAttribute ( name, value );

                }

                return this;

            } else {

                return ( this.length > 0 ) ? this.nodes[0].getAttribute ( name ) : null;

            }

        },

        data: function ( name, value ) {

            var return_value = this.attr ( 'data-' + name, value );

            return ( typeof value !== 'undefined' ) ? return_value : deserialize_value ( return_value );

        },

        prop: function ( name, value ) {

            if ( typeof value !== 'undefined' ) {

                for ( var i = 0; i < this.length; i++ ) {

                    this.nodes[i][name] = value;

                }

                return this;

            } else {

                return ( this.length > 0 ) ? this.nodes[0][name] : null;

            }

        },

        checked: function ( value ) {

            return this.prop ( 'checked', value );

        },

        text: function ( text ) {

            return this.prop ( 'textContent', text );

        },

        html: function ( html ) {

            return this.prop ( 'innerHTML', html );

        },

        replaceWith: function ( html ) {

            return this.prop ( 'outerHTML', html );

        },

        empty: function () {

            for ( var i = 0; i < this.length; i++ ) {

                while ( this.nodes[i].hasChildNodes () ) {

                    this.nodes[i].removeChild ( this.nodes[i].lastChild );

                }

            }

            return this;

        },

        val: function ( value ) {

            if ( typeof value !== 'undefined' ) {

                for ( var i = 0; i < this.length; i++ ) {

                    this.nodes[i].value = value;

                }

                return this;

            } else {

                if ( this.length < 1 ) return null;
                else return ( this.nodes[0].tagName === 'select' ) ? this.nodes[0].options[this.nodes[0].selectedIndex].value : this.nodes[0].value;

            }

        },

        scrollTop: function ( pixels ) {

            return this.prop ( 'scrollTop', pixels );

        },

        scrollBottom: function ( pixels ) {

            for ( var i = 0; i < this.length; i++ ) {

                this.nodes[i].scrollTop = this.nodes[i].scrollHeight - this.nodes[i].clientHeight - ( pixels || 0 );

            }

            return this;

        },

        scrollLeft: function ( pixels ) {

            return this.prop ( 'scrollLeft', pixels );

        },

        // EVENTS

        on: function ( events, handler ) { //TODO: add support for selector

            events = events.split ( ' ' );

            for ( var i = 0; i < this.length; i++ ) {

                for ( var ei = 0; ei < events.length; ei++ ) {

                    if ( this.nodes[i].addEventListener ) {

                        this.nodes[i].addEventListener ( events[ei], handler );

                    } else {

                        this.nodes[i].attachEvent ( 'on' + events[ei], function () {

                            handler.call ( this.nodes[i] );

                        });

                    };

                }

            }

            return this;

        },

        off: function ( events, handler ) { //TODO: add support for selector

            events = events.split ( ' ' );

            for ( var i = 0; i < this.length; i++ ) {

                for ( var ei = 0; ei < events.length; ei++ ) {

                    if ( this.nodes[i].removeEventListener ) this.nodes[i].removeEventListener ( events[ei], handler );
                    else this.nodes[i].detachEvent ( 'on' + events[ei], handler );

                }

            }

            return this;

        },

        trigger: function ( events ) {

            events = events.split ( ' ' );

            for ( var ei = 0; ei < events.length; ei++ ) {

                var event_obj;

                if ( window.CustomEvent ) {

                    event_obj = new CustomEvent ( events[ei] );

                    event_obj.initCustomEvent ( events[ei], true, true, null );

                } else {

                    event_obj = document.createEvent ( events[ei] );

                    event_obj.initEvent ( events[ei], true, true );

                }

                for ( var i = 0; i < this.length; i++ ) {

                    this.nodes[i].dispatchEvent ( event_obj );

                }

            }

            return this;

        },

        one: function ( events, handler ) {

            return this.on ( events, function handler_wrp ( event ) {

                var node = this;

                $off ( node, event.type, handler_wrp );

                return handler.call ( node, event );

            });

        },

        // CSS

        css: function ( name, value ) {

            if ( typeof name === 'object' ) {

                for ( key in name ) this.css ( key, name[key] );

                return this;

            } else {

                name = camelize ( name );

                if ( typeof value !== 'undefined' ) {

                    for ( var i = 0; i < this.length; i++ ) {

                        this.nodes[i].style[name] = value;

                    }

                    return this;

                } else {

                    return ( this.length > 0 ) ? getComputedStyle ( this.nodes[0] )[name] : null;

                }

            }

        },

        addClass: function ( classes ) {

            classes = classes.split ( ' ' );

            for ( var i = 0; i < this.length; i++ ) {

                for ( var ci = 0; ci < classes.length; ci++ ) {

                    lQuery.node_fn.addClass ( this.nodes[i], classes[ci] );

                }

            }

            return this;

        },

        removeClass: function ( classes ) {

            classes = classes.split ( ' ' );

            for ( var i = 0; i < this.length; i++ ) {

                for ( var ci = 0; ci < classes.length; ci++ ) {

                    lQuery.node_fn.removeClass ( this.nodes[i], classes[ci] );

                }

            }

            return this;

        },

        hasClass: function ( classes ) {

            classes = classes.split ( ' ' );

            for ( var i = 0; i < this.length; i++ ) {

                for ( var ci = 0; ci < classes.length; ci++ ) {

                    if ( !lQuery.node_fn.hasClass ( this.nodes[i], classes[ci] ) ) return false;

                }

            }

            return ( this.length > 0 );

        },

        toggleClass: function ( classes, force ) {

            if ( typeof force !== 'undefined' ) {

                return ( force ) ? this.addClass ( classes ) : this.removeClass ( classes );

            } else {

                classes = classes.split ( ' ' );

                for ( var i = 0; i < this.length; i++ ) {

                    for ( var ci = 0; ci < classes.length; ci++ ) {

                        ( lQuery.node_fn.hasClass ( this.nodes[i], classes[ci] ) ) ? lQuery.node_fn.removeClass ( this.nodes[i], classes[ci] ) : lQuery.node_fn.addClass ( this.nodes[i], classes[ci] );

                    }

                }

                return this;

            }

        },

        show: function () {

            return this.css ( 'display', 'block' );

        },

        hide: function () {

            return this.css ( 'display', 'none' );

        },

        toggle: function () { //FIXME: add the 'hidden' class instead

            for ( var i = 0; i < this.length; i++ ) {

                this.nodes[i].style['display'] = ( getComputedStyle ( this.nodes[i] )['display'] !== 'block' ) ? 'block' : 'none';

            }

            return this;

        },

        // INFOS

        offset: function () {

            if ( this.length < 1 ) return null;

            return lQuery.node_fn.offset ( this.nodes[0] );

        },

        offsetParent: function () {

            if ( this.length < 1 ) return null;

            var parent = this.nodes[0].offsetParent || document.body;

            while ( parent && !rootNodeRE.test ( parent.nodeName ) && getComputedStyle ( parent )['position'] === 'static' ) {

                parent = parent.offsetParent;

            }

            return parent;

        },

        position: function () {

            if ( this.length < 1 ) return null;

            var offsetParent = this.offsetParent (),
                offset = this.offset (),
                parentOffset = rootNodeRE.test ( offsetParent.nodeName ) ? { top: 0, left: 0 } : lQuery.node_fn.offset ( offsetParent );

            offset.top  -= parseFloat ( getComputedStyle ( this.nodes[0] )['margin-top'] ) || 0;
            offset.left -= parseFloat ( getComputedStyle ( this.nodes[0] )['margin-left'] ) || 0;

            parentOffset.top  += parseFloat ( getComputedStyle ( offsetParent )['border-top-width'] ) || 0;
            parentOffset.left += parseFloat ( getComputedStyle ( offsetParent )['border-left-width'] ) || 0;

            return {
                top:  offset.top  - parentOffset.top,
                left: offset.left - parentOffset.left
            };

        },

        width: function () {

            return this.prop ( 'clientWidth' );

        },

        height: function () {

            return this.prop ( 'clientHeight' );

        },

        outerWidth: function () {

            return this.prop ( 'offsetWidth' );

        },

        outerHeight: function () {

            return this.prop ( 'offsetHeight' );

        }

        // FORM

        //TODO: form methods (serialize)
        //TODO: form post thought ajax

    };

}());

/* Namespaces */

window.lQuery = lQuery;
if ( !window.$ ) window.$ = lQuery;
if ( !window.$$ ) window.$$ = lQuery;

/* Main objects */

lQuery.dom_ready ( function () {

    $window = $(window);
    $document = $(document);
    $html = $(document.documentElement);
    $body = $(document.body);

});



/* GAME */

var game = function ( options ) {

    // FUNCTIONS

    var init = function () {

        init_board ();

        $board.attr ( 'class', 'sizex-' + options.size.x + ' sizey-' + options.size.y );

        $board_content.html ( '' );

        add_placeholders ();

        for ( var n = 0; n < options.blocks.start_nr; n++ ) {

            add_block ();

        }

        $score.html ( options.score.start );
        $best.html ( 0 ); //TODO: get it from the cookies

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
            value = check_double_probability () ? options.blocks.base * 2 : options.blocks.base;

        if ( index === false ) return false;

        board[index].value = value;

        var block_html = get_block_html ( index, value );

        $board_content.append ( block_html );

        var $block = $board_content.find ( '.index-' + index );

        positionate_block ( $block, index );

        return true;

    };

    var get_block_html = function ( index, value ) {

        return '<div class="block index-' + index + ' value-' + value + '" data-value="' + value + '"></div>';

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

    var check_double_probability = function () {

        return ( Math.floor ( Math.random () * 100 ) + 1 ) <= options.blocks.double_probability;

    };

    var move_blocks = function ( offset, axis ) {

        var reversed = false;
            merged = false,
            moved = false;

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

                    board[n].value = false;

                    var $start_block = $board_content.find ( '.block.index-' + ( reversed ? options.size.x * options.size.y - 1 - n : n ) );
                    var $end_block = $board_content.find ( '.block.index-' + ( reversed ? options.size.x * options.size.y - 1 - new_offset : new_offset ) );

                    $end_block.attr ( 'class', 'block index-' + ( reversed ? options.size.x * options.size.y - 1 - new_offset : new_offset ) + ' value-' + board[new_offset].value );
                    $end_block.data ( 'value', board[new_offset].value );

                    if ( options.debug ) {

                        console.log ( '- merging...' );
                        console.log ( 'offset: ' + offset );
                        console.log ( 'current: ' + current.value );
                        console.log ( 'offsetted: ' + offsetted.value );
                        console.log ( $start_block.toArray () );
                        console.log ( $end_block.toArray () );

                    }

                    $start_block.remove ();

                    //TODO: animations

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

                $start_block.attr ( 'class', 'block index-' + ( reversed ? options.size.x * options.size.y - 1 - last_empty_offset : last_empty_offset ) + ' value-' + board[last_empty_offset].value );

                if ( options.debug ) {

                    console.log ( '- moving...' );
                    console.log ( 'offset: ' + offset );
                    console.log ( 'starting index: ' + ( reversed ? options.size.x * options.size.y - 1 - n : n ) );
                    console.log ( 'ending index: ' + ( reversed ? options.size.x * options.size.y - 1 - last_empty_offset : last_empty_offset ) );
                    console.log ( $start_block.toArray () );

                }

                positionate_block ( $start_block, ( reversed ? options.size.x * options.size.y - 1 - last_empty_offset : last_empty_offset ) );

                //TODO: animations

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

        // RETURNING

        return merged || moved;

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
        $board = $('#board'),
        $board_content = $board.find ( '.content' ),
        $score = $('.infobox.score .content'),
        $best = $('.infobox.best .content');

    // INIT

    init ();

    // EVENTS

    // Keyboard

    $window.on ( 'keydown', function ( event ) {

        if ( listening === false ) return;

        if ( event.keyCode < 37 || event.keyCode > 40 ) return;

        listening = false;

        var moved = false;

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

            add_block ();

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

    //TODO

};

/* OPTIONS */

var options = {
    debug: false,
    size: { //FIXME: if the ratio isn't 1:1 the board still stends squared
        x: 4, 
        y: 4
    },
    blocks: {
        start_nr: 2,
        base: 2,
        double_probability: 10 //%
    },
    score: {
        start: 0,
        goal: 2048,
        best_cookie_name: 'best'
    }
};

/* READY */

$.dom_ready ( function () {

    game ( options );

});




