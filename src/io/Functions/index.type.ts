import { Server, Socket } from "socket.io";

export type IoFunctionProps<T> = {
    defaultProps: {
        socket: Socket;
        io: Server;
        Clients?: { [ key: string ] : Socket }
    },

    customProps: {
        [ P in keyof T ]: T[P];
    };
};

export type TokenType = "user" | "organizer";
