'use strict';

const Hapi = require('hapi');
const Nes = require('nes');
const Inert = require('inert');
const Faker = require('faker');
const Db = require('./plugins/db');

const server = new Hapi.Server();
server.connection({
    port: 3000
});

server.register([Nes, Inert, Db], (err) => {

    if (err) {
        throw err;
    }

    //Serve static files in 'public' directory
    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: 'public'
            }
        }
    });

    //Return the last 5 entries stored in db
    server.route({
        method: 'GET',
        path: '/timeline',
        handler: function (request, reply) {

            server.methods.db.findEntries(5, (err, result) => {

                if (err) {
                    return reply().code(500);
                }

                return reply(result);
            });
        }
    });

    //Create a new entry
    server.route({
        method: 'GET',
        path: '/timeline/createEntry',
        handler: function (request, reply) {

            const entry = {
                createdAt: new Date(),
                user: Faker.name.findName(),
                message: Faker.lorem.paragraph(),
                avatar: Faker.image.avatar()
            };

            server.methods.db.saveEntry(entry, (err) => {

                if (err) {
                    return reply().code(500);
                }

                return reply().code(204);
            });
        }
    });

    //Declare the subscription to timeline updates the client can subscribe to
    server.subscription('/timeline/updates');

    // Start the server
    server.start((err) => {

        if (err) {
            throw err;
        }

        //Setup the RethinkDB change-feed and push it to the websocket connection.
        server.methods.db.setupChangefeedPush();

        console.log('Server running at:', server.info.uri);
    });
});
