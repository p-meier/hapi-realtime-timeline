'use strict';

const r = require('rethinkdb');

exports.register = function (server, options, next) {

    const db = 'hapi_timeline';
    const entriesTable = 'entries';
    let conn;

    //Connect and initialize
    r.connect((err, connection) => {

        if (err) {
            return next(err);
        }

        conn = connection;

        //Create db
        r.dbCreate(db).run(connection, (err, result) => {

            //Create entries table
            r.db(db).tableCreate(entriesTable).run(connection, (err, result) => {
              
                return next();
            });

        });
    });

    server.method('db.saveEntry', (entry, callback) => {

        r.db(db).table(entriesTable).insert(entry).run(conn, callback);
    });

    server.method('db.findEntries', (limit, callback) => {

        r.db(db).table(entriesTable).orderBy(r.desc('createdAt')).limit(limit).run(conn, callback);
    });

    server.method('db.setupChangefeedPush', () => {

        r.db(db).table(entriesTable).changes().run(conn, (err, cursor) => {

            cursor.each((err, item) => {

                server.publish('/timeline/updates', item.new_val);
            });
        });
    }, {
        callback: false
    });
};

exports.register.attributes = {
    name: 'db'
};
