import { Server, Socket } from "socket.io";
import * as Io_Functions from "./Functions";

const io = new Server();

io.on("connection", async ( socket: Socket ) => {
    socket.on("updateUserLocation", async ( customProps: Io_Functions.updateUserLocationProps ) => {
        Io_Functions.updateUserLocation({ defaultProps: { socket, io }, customProps });
    });

    socket.on("onHeartFood", async ( customProps: Io_Functions.onHeartFoodProps ) => {
        Io_Functions.onHeartFood({ defaultProps: { socket, io }, customProps });
    });

    socket.on("onWriteTruckReview", async ( customProps: Io_Functions.onWriteTruckReviewProps ) => {
        Io_Functions.onWriteTruckReview({ defaultProps: { socket, io }, customProps });
    });
});

export { io as IoServer };
