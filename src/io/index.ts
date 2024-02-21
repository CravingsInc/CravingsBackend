import { Server, Socket } from "socket.io";
import * as models from "../models";
import { Utils } from "../utils";
import * as Io_Functions from "./Functions";
import { IoErrorEnums } from "./IoErrorEnums";

const io = new Server();

io.on("connection", async ( socket: Socket ) => {
    socket.on("updateUserLocation", async ( customProps: Io_Functions.updateUserLocationProps ) => {
        Io_Functions.updateUserLocation({ defaultProps: { socket, io }, customProps });
    });

    socket.on("onHeartFood", async ( customProps: Io_Functions.onHeartFoodProps ) => {
        Io_Functions.onHeartFood({ defaultProps: { socket, io }, customProps });
    })
});

export { io as IoServer };
