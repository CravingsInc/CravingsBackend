import { Server, Socket } from "socket.io";
import * as models from "../models";
import { Utils } from "../utils";
import * as Io_Functions from "./Functions";
import { IoErrorEnums } from "./IoErrorEnums";

const io = new Server();

io.on("connection", async ( socket: Socket ) => {
    
});

export { io as IoServer };
