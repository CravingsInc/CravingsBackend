import { IoFunctionProps } from "./index.type";

import * as models from "../../models";

import { Utils } from "../../utils";

import { IoErrorEnums } from "../IoErrorEnums";

export type updateUserLocationProps = {
    token: string;
    location: {
        longitude: number;
        latitude: number;
    }
}

export const updateUserLocation = async ({ defaultProps: { io, socket }, customProps }: IoFunctionProps<updateUserLocationProps>) => {
    try {
        let user: models.Users;

        try {
            user = await Utils.getUserFromJsWebToken(customProps.token);
        }catch(e: any) {
            socket.emit("error", { errorMessage: e.message, timestamp: new Date(), errorCode: IoErrorEnums.JWT_ERROR, socketEvent: "updateUserLocation" })
            return
        }

        user.longitude = customProps.location.longitude,
        user.latitude = customProps.location.latitude
        await user.save()

        return socket.emit("updateUserLocationResponse", { response: "Updated Location Successfully" });
    }catch(e: any) {
        console.log(e);
        socket.emit("error", { errorMessage: "Issue Updating Location", timestamp: new Date(), errorCode: IoErrorEnums.UnExpectedServerError, socketEvent: "updateUserLocation" })
    }
}
