//#region Imports

// ENV variables
import "reflect-metadata";
require('dotenv').config()

// Database
import { createConnection } from "typeorm";
import * as models from '../models';

// Migration
import { runUsers } from "./users";
import { orgRun } from "./organizers";
import { runEvents } from "./events";

//#region Clear Database
const clearAll = async () => {
    console.log("Clearing all database tables...");

    console.log("\n\tClearing User Table...");
    await models.Users.clear();
    
    console.log("\n\tClearing Organizer Table...");
    await models.Organizers.clear();
    
    console.log("\n\tClearing SiteHistory Table...");
    await models.SiteHistory.clear();
}

//#region Main
const main = async () => {
    console.log("Starting migration...");

    let date = new Date();
    
    console.log("\n\tCreating database connection...");

    const connection = await createConnection({
        type: "sqlite",
        database: "./db.sqlite3",
        entities: ["src/models/*.ts"],
        synchronize: true,
    });

    let timeDiff = Date.now() - date.getTime();

    console.log(`\n\tConnection established in ${timeDiff} mili-seconds`);

    await clearAll();

    let users = await runUsers();

    let orgs = await orgRun( users.userIds );

    let orgsEvents = await runEvents( orgs.orgIds );

}

try {
    main();
}catch( e ) {
    console.error(e);
}
