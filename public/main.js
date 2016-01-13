var Nes = require('nes/client');
var $ = require('jquery');
var Handlebars = require('handlebars');

//Compile the template
var source = $("#entry-template").html();
var template = Handlebars.compile(source);

//Load initial entries
$.getJSON('/timeline', function (data) {

    data.forEach(function (item) {

        var html = template(item);
        $("#timeline").append(html);
    });
});

//Create a new entry
$('#add-entry').click(function () {
    $.get('/timeline/createEntry');
});

//Setup the websocket connection and react to updates
var client = new Nes.Client('ws://localhost:3000');
client.connect(function (err) {

    var handler = function (item) {

        var html = template(item);
        $("#timeline").prepend(html);
    };

    client.subscribe('/timeline/updates', handler, function (err) {});
});
